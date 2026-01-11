#!/usr/bin/env python3
"""
Enrich only victims with missing or invalid activity/sector.
Targets: activity = "Not Found", "Unknown", or empty
"""

import os
import sys
import json
import time
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Load environment
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)

home = os.getenv("DRAGONS_HOME", os.getenv("RANSOMWARELIVE_HOME"))
if not home:
    print("ERROR: DRAGONS_HOME or RANSOMWARELIVE_HOME not set")
    sys.exit(1)

BASE_DIR = Path(home)
DB_DIR = BASE_DIR / "db"
VICTIMS_FILE = DB_DIR / "victims.json"
PROGRESS_FILE = DB_DIR / "activity_enrichment_progress.json"

# OpenAI/LM Studio config
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "lm-studio")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "http://localhost:1234/v1")
LM_STUDIO_MODEL = os.getenv("LM_STUDIO_MODEL", "local-model")

try:
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)
except ImportError:
    print("ERROR: openai package not installed")
    sys.exit(1)

# Valid sectors/industries
VALID_SECTORS = [
    "Technology", "Healthcare", "Finance", "Manufacturing", "Retail",
    "Education", "Government", "Energy", "Transportation", "Construction",
    "Real Estate", "Legal", "Media", "Hospitality", "Agriculture",
    "Telecommunications", "Insurance", "Automotive", "Aerospace", "Pharmaceuticals",
    "Food & Beverage", "Mining", "Utilities", "Non-Profit", "Professional Services",
    "Business Services", "Consumer Services", "Financial Services", "IT Services"
]

def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {"processed_indices": [], "last_index": 0, "total_enriched": 0}

def save_progress(progress):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

def needs_activity_enrichment(victim):
    """Check if victim needs activity/sector enrichment"""
    activity = victim.get('activity', '')
    if not activity:
        return True
    activity_lower = activity.lower().strip()
    if activity_lower in ['unknown', 'not found', 'n/a', 'none', '']:
        return True
    return False

def enrich_activity(victim_name, website=None, country=None):
    """Use AI to determine the industry/sector of a company"""
    
    context_parts = [f"Company name: {victim_name}"]
    if website:
        context_parts.append(f"Website: {website}")
    if country:
        context_parts.append(f"Country: {country}")
    
    context = "\n".join(context_parts)
    
    prompt = f"""Based on the company information below, determine the most likely industry/sector.

{context}

Choose ONE sector from this list:
{', '.join(VALID_SECTORS)}

If you cannot determine the sector with reasonable confidence, respond with "Unknown".

Respond with ONLY the sector name, nothing else."""

    try:
        response = client.chat.completions.create(
            model=LM_STUDIO_MODEL,
            messages=[
                {"role": "system", "content": "You are a business analyst expert at identifying company industries based on their name and website."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=50
        )
        
        result = response.choices[0].message.content.strip()
        
        # Validate response
        for sector in VALID_SECTORS:
            if sector.lower() in result.lower():
                return sector
        
        if "unknown" in result.lower():
            return None
            
        return result if len(result) < 50 else None
        
    except Exception as e:
        print(f"    ⚠️ AI error: {e}")
        return None

def main():
    print("=" * 60)
    print("Activity/Sector Enrichment Script")
    print("=" * 60)
    
    # Load victims
    if not VICTIMS_FILE.exists():
        print(f"ERROR: {VICTIMS_FILE} not found")
        sys.exit(1)
    
    with open(VICTIMS_FILE, 'r', encoding='utf-8') as f:
        victims = json.load(f)
    
    print(f"Loaded {len(victims)} victims")
    
    # Find victims needing enrichment
    needs_enrichment = []
    for i, v in enumerate(victims):
        if needs_activity_enrichment(v):
            needs_enrichment.append((i, v))
    
    print(f"Found {len(needs_enrichment)} victims needing activity enrichment")
    
    # Load progress
    progress = load_progress()
    processed_set = set(progress.get("processed_indices", []))
    
    # Filter already processed
    to_process = [(i, v) for i, v in needs_enrichment if i not in processed_set]
    print(f"Already processed: {len(processed_set)}")
    print(f"Remaining: {len(to_process)}")
    print()
    
    if not to_process:
        print("✅ All victims with missing activity have been processed!")
        return
    
    enriched_count = 0
    save_interval = 50
    
    for count, (idx, victim) in enumerate(to_process, 1):
        name = victim.get('name', victim.get('post_title', 'Unknown'))
        website = victim.get('website', '')
        country = victim.get('country', '')
        
        print(f"[{count}/{len(to_process)}] {name}")
        print(f"  Current activity: '{victim.get('activity', '')}'")
        
        # Enrich
        new_activity = enrich_activity(name, website, country)
        
        if new_activity:
            victims[idx]['activity'] = new_activity
            print(f"  ✅ New activity: {new_activity}")
            enriched_count += 1
        else:
            print(f"  ⚠️ Could not determine activity")
        
        # Mark as processed
        processed_set.add(idx)
        progress["processed_indices"] = list(processed_set)
        progress["last_index"] = idx
        progress["total_enriched"] = enriched_count
        
        # Save periodically
        if count % save_interval == 0:
            print(f"\n💾 Saving progress ({count} processed, {enriched_count} enriched)...")
            with open(VICTIMS_FILE, 'w', encoding='utf-8') as f:
                json.dump(victims, f, indent=2, ensure_ascii=False)
            save_progress(progress)
            print("✅ Saved!\n")
        
        # Small delay to not overwhelm LM Studio
        time.sleep(0.5)
    
    # Final save
    print(f"\n💾 Final save...")
    with open(VICTIMS_FILE, 'w', encoding='utf-8') as f:
        json.dump(victims, f, indent=2, ensure_ascii=False)
    save_progress(progress)
    
    print(f"\n{'=' * 60}")
    print(f"✅ Completed!")
    print(f"   Processed: {len(to_process)}")
    print(f"   Enriched: {enriched_count}")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()

