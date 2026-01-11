#!/usr/bin/env python3
"""
Import decryptors from NoMoreRansom scrape into the application database
"""

import json
import uuid
from datetime import datetime
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent
DB_DIR = BASE_DIR / "db"
INPUT_FILE = DB_DIR / "decryptors_with_guides.json"
OUTPUT_FILE = DB_DIR / "decryptors.json"
BACKUP_FILE = DB_DIR / "decryptors_backup.json"

def generate_id(group_name, decryptor_name):
    """Generate a unique ID for a decryptor"""
    slug = f"{group_name}-{decryptor_name}".lower()
    slug = slug.replace(" ", "-").replace("/", "-").replace("_", "-")
    # Remove special characters
    slug = ''.join(c if c.isalnum() or c == '-' else '' for c in slug)
    # Add short uuid to ensure uniqueness
    short_id = str(uuid.uuid4())[:8]
    return f"{slug[:50]}-{short_id}"

def convert_decryptor(raw):
    """Convert a raw decryptor entry to our application format"""
    now = datetime.now().isoformat()
    
    # Generate unique ID
    decryptor_id = generate_id(raw['group_name'], raw['decryptor_name'])
    
    # Build the decryptor object
    decryptor = {
        "id": decryptor_id,
        "group_name": raw['group_name'],
        "decryptor_name": raw['decryptor_name'],
        "provider": raw.get('provider', ''),
        "provider_url": raw.get('provider_url', ''),
        "download_url": raw.get('download_url', ''),
        "description": raw.get('description', ''),
        "detailed_description": "",  # Will be filled manually or with AI
        "file_extensions": raw.get('file_extensions', []),
        "status": raw.get('status', 'active'),
        "release_date": "",
        "notes": raw.get('notes', ''),
        "how_to_guide_type": raw.get('how_to_guide_type', 'url'),
        "how_to_guide_url": raw.get('how_to_guide_url', ''),
        "how_to_guide_text": "",
        "local_guide_path": raw.get('local_guide_path', ''),
        "created_at": now,
        "updated_at": now
    }
    
    return decryptor

def main():
    print("=" * 60)
    print("📥 Importing Decryptors to Application Database")
    print("=" * 60)
    
    # Load input data
    if not INPUT_FILE.exists():
        print(f"❌ Error: {INPUT_FILE} not found!")
        return
    
    with open(INPUT_FILE, 'r') as f:
        data = json.load(f)
    
    raw_decryptors = data.get('decryptors', [])
    print(f"📊 Found {len(raw_decryptors)} decryptors in import file")
    
    # Load existing decryptors (backup first)
    existing_decryptors = []
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, 'r') as f:
            existing_decryptors = json.load(f)
        print(f"📂 Found {len(existing_decryptors)} existing decryptors")
        
        # Create backup
        with open(BACKUP_FILE, 'w') as f:
            json.dump(existing_decryptors, f, indent=2)
        print(f"💾 Backup saved to: {BACKUP_FILE}")
    
    # Track existing group+name combinations to avoid duplicates
    existing_keys = set()
    for d in existing_decryptors:
        key = f"{d['group_name'].lower()}|{d['decryptor_name'].lower()}"
        existing_keys.add(key)
    
    # Convert and add new decryptors
    new_decryptors = []
    updated_count = 0
    skipped_count = 0
    
    for raw in raw_decryptors:
        key = f"{raw['group_name'].lower()}|{raw['decryptor_name'].lower()}"
        
        if key in existing_keys:
            skipped_count += 1
            continue
        
        decryptor = convert_decryptor(raw)
        new_decryptors.append(decryptor)
        existing_keys.add(key)
    
    print(f"\n🆕 New decryptors to add: {len(new_decryptors)}")
    print(f"⏭️ Skipped (already exist): {skipped_count}")
    
    # Merge existing + new
    all_decryptors = existing_decryptors + new_decryptors
    
    # Sort by group name
    all_decryptors.sort(key=lambda x: x['group_name'].lower())
    
    # Save to output file
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(all_decryptors, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Total decryptors in database: {len(all_decryptors)}")
    print(f"📁 Saved to: {OUTPUT_FILE}")
    
    # Print summary by provider
    providers = {}
    for d in all_decryptors:
        provider = d.get('provider', 'Unknown')
        providers[provider] = providers.get(provider, 0) + 1
    
    print("\n📊 Decryptors by Provider:")
    for provider, count in sorted(providers.items(), key=lambda x: -x[1]):
        print(f"   {provider}: {count}")
    
    # Print groups with decryptors
    groups = set(d['group_name'] for d in all_decryptors)
    print(f"\n🔐 Total ransomware groups with decryptors: {len(groups)}")

if __name__ == "__main__":
    main()

