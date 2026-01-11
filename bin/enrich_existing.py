#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🐉 Dragons-RansomwareMonitoring - AI Enrichment Script with Web Search
Enriches existing victim records using:
1. Website scraping (about/contact pages)
2. Web search (DuckDuckGo)
3. AI analysis with gathered information

Features:
- Progress tracking (resume from interruption)
- Auto-save every N records
- Website-first prioritization
"""

import json
import os
import sys
import time
import re
import signal
import requests
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import pycountry
import argparse

# Load environment
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Configuration
home = os.getenv("DRAGONS_HOME", os.getenv("RANSOMWARELIVE_HOME"))
db_dir = Path(home) / (os.getenv("DB_DIR", "/db").lstrip("/"))
VICTIMS_FILE = db_dir / "victims.json"
BACKUP_FILE = db_dir / f"victims_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
PROGRESS_FILE = db_dir / "enrichment_progress.json"

# Auto-save interval
AUTO_SAVE_INTERVAL = 10  # Save every 10 records

# LM Studio Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', 'lm-studio')
OPENAI_BASE_URL = os.getenv('OPENAI_BASE_URL', 'http://localhost:1234/v1')
LM_STUDIO_MODEL = os.getenv('LM_STUDIO_MODEL', 'openai/gpt-oss-20b')

# Web request settings
REQUEST_TIMEOUT = 15
import random

# Multiple User Agents for rotation
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36",
]

def get_random_ua():
    return random.choice(USER_AGENTS)

USER_AGENT = USER_AGENTS[0]  # Default for backwards compatibility

# Search engine state tracking
_search_engine_failures = {"duckduckgo": 0, "bing": 0, "brave": 0, "google": 0}
_last_search_time = 0

# Sector list (NIS Directive based)
SECTOR_LIST = [
    "Manufacturing", "Construction", "Transportation/Logistics", "Technology",
    "Healthcare", "Financial Services", "Public Sector", "Education",
    "Business Services", "Consumer Services", "Energy", "Telecommunication",
    "Agriculture and Food Production", "Hospitality and Tourism", "Retail",
    "Legal Services", "Real Estate", "Media and Entertainment"
]

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

def create_client():
    """Create OpenAI client configured for LM Studio"""
    return OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)

# ═══════════════════════════════════════════════════════════════════════════════
# PROGRESS TRACKING
# ═══════════════════════════════════════════════════════════════════════════════

def load_progress() -> dict:
    """Load progress from file"""
    if PROGRESS_FILE.exists():
        try:
            with open(PROGRESS_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {
        'processed_indices': [],
        'last_index': -1,
        'total_enriched': 0,
        'started_at': None,
        'last_updated': None
    }

def save_progress(progress: dict):
    """Save progress to file"""
    progress['last_updated'] = datetime.now().isoformat()
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

def clear_progress():
    """Clear progress file"""
    if PROGRESS_FILE.exists():
        PROGRESS_FILE.unlink()
        log("🗑️ Progress file cleared")

# ═══════════════════════════════════════════════════════════════════════════════
# WEB SCRAPING FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def clean_text(text: str) -> str:
    """Clean extracted text"""
    if not text:
        return ""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove script/style content leftovers
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()[:2000]  # Limit length

def scrape_website(url: str) -> dict:
    """
    Scrape company website for useful information
    Returns: {title, description, about_text, contact_info, meta_keywords}
    """
    result = {
        'title': '',
        'description': '',
        'about_text': '',
        'contact_info': '',
        'meta_keywords': '',
        'success': False
    }
    
    if not url:
        return result
    
    # Normalize URL
    if not url.startswith('http'):
        url = 'https://' + url
    
    try:
        headers = {'User-Agent': USER_AGENT}
        
        # First, try the main page
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT, verify=False)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract title
        title_tag = soup.find('title')
        if title_tag:
            result['title'] = clean_text(title_tag.get_text())
        
        # Extract meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            result['description'] = clean_text(meta_desc.get('content', ''))
        
        # Extract meta keywords
        meta_keywords = soup.find('meta', attrs={'name': 'keywords'})
        if meta_keywords:
            result['meta_keywords'] = clean_text(meta_keywords.get('content', ''))
        
        # Try to find about page
        about_links = []
        for link in soup.find_all('a', href=True):
            href = link.get('href', '').lower()
            text = link.get_text().lower()
            if any(word in href or word in text for word in ['about', 'company', 'who-we-are', 'notre-societe', 'uber-uns', 'chi-siamo', 'quienes-somos', 'hakkimizda']):
                about_links.append(urljoin(url, link['href']))
        
        # Scrape about page if found
        if about_links:
            try:
                about_response = requests.get(about_links[0], headers=headers, timeout=REQUEST_TIMEOUT, verify=False)
                about_soup = BeautifulSoup(about_response.text, 'html.parser')
                
                # Remove script and style tags
                for tag in about_soup(['script', 'style', 'nav', 'header', 'footer']):
                    tag.decompose()
                
                # Get main content
                main_content = about_soup.find('main') or about_soup.find('article') or about_soup.find('div', class_=re.compile(r'content|main|about', re.I))
                if main_content:
                    result['about_text'] = clean_text(main_content.get_text())
                else:
                    # Get body text
                    body = about_soup.find('body')
                    if body:
                        result['about_text'] = clean_text(body.get_text())[:1500]
            except:
                pass
        
        # Try to find contact/address info for country detection
        contact_patterns = [
            r'(?:address|location|headquarters?)[\s:]+([^<\n]{10,100})',
            r'(?:\d{5}|\d{4})\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)',  # Postal code + city
            r'([A-Z]{2}[-\s]?\d{4,5})',  # European postal codes
        ]
        
        page_text = soup.get_text()
        for pattern in contact_patterns:
            match = re.search(pattern, page_text, re.I)
            if match:
                result['contact_info'] += ' ' + match.group(0)
        
        result['success'] = True
        
    except requests.exceptions.Timeout:
        log(f"  ⏱️ Website timeout: {url}")
    except requests.exceptions.RequestException as e:
        log(f"  ⚠️ Website error: {str(e)[:50]}")
    except Exception as e:
        log(f"  ⚠️ Scrape error: {str(e)[:50]}")
    
    return result

def web_search(query: str, num_results: int = 3) -> str:
    """
    Multi-engine web search with fallback and rate limiting
    Tries: DuckDuckGo -> Bing -> Brave -> Google (scraping)
    Returns combined search results text
    """
    global _search_engine_failures, _last_search_time
    
    # Rate limiting - wait between searches
    elapsed = time.time() - _last_search_time
    if elapsed < 2:
        time.sleep(2 - elapsed + random.uniform(0.5, 1.5))
    _last_search_time = time.time()
    
    encoded_query = requests.utils.quote(query)
    headers = {'User-Agent': get_random_ua()}
    
    # Search engine configurations
    engines = [
        {
            "name": "duckduckgo",
            "url": f"https://html.duckduckgo.com/html/?q={encoded_query}",
            "result_selector": ("div", {"class": "result"}),
            "title_selector": ("a", {"class": "result__a"}),
            "snippet_selector": ("a", {"class": "result__snippet"}),
        },
        {
            "name": "bing",
            "url": f"https://www.bing.com/search?q={encoded_query}",
            "result_selector": ("li", {"class": "b_algo"}),
            "title_selector": ("h2", {}),
            "snippet_selector": ("p", {}),
        },
        {
            "name": "brave",
            "url": f"https://search.brave.com/search?q={encoded_query}",
            "result_selector": ("div", {"class": "snippet"}),
            "title_selector": ("span", {"class": "snippet-title"}),
            "snippet_selector": ("p", {"class": "snippet-description"}),
        },
    ]
    
    # Sort engines by failure count (prefer less failed ones)
    engines.sort(key=lambda x: _search_engine_failures.get(x["name"], 0))
    
    for engine in engines:
        # Skip if engine has failed too many times recently
        if _search_engine_failures.get(engine["name"], 0) > 5:
            continue
            
        try:
            # Random delay between engine attempts
            time.sleep(random.uniform(0.3, 0.8))
            
            response = requests.get(
                engine["url"], 
                headers=headers, 
                timeout=REQUEST_TIMEOUT,
                allow_redirects=True
            )
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            results = []
            tag, attrs = engine["result_selector"]
            for result in soup.find_all(tag, attrs)[:num_results]:
                title_tag, title_attrs = engine["title_selector"]
                snippet_tag, snippet_attrs = engine["snippet_selector"]
                
                title_el = result.find(title_tag, title_attrs) if title_attrs else result.find(title_tag)
                snippet_el = result.find(snippet_tag, snippet_attrs) if snippet_attrs else result.find(snippet_tag)
                
                title = title_el.get_text().strip() if title_el else ""
                snippet = snippet_el.get_text().strip() if snippet_el else ""
                
                if title or snippet:
                    results.append(f"{title}: {snippet}" if title and snippet else title or snippet)
            
            if results:
                # Reset failure count on success
                _search_engine_failures[engine["name"]] = 0
                return " | ".join(results)[:1500]
                
        except requests.exceptions.Timeout:
            _search_engine_failures[engine["name"]] = _search_engine_failures.get(engine["name"], 0) + 1
            continue
        except requests.exceptions.RequestException as e:
            _search_engine_failures[engine["name"]] = _search_engine_failures.get(engine["name"], 0) + 1
            continue
        except Exception as e:
            _search_engine_failures[engine["name"]] = _search_engine_failures.get(engine["name"], 0) + 1
            continue
    
    # All engines failed - log once
    log(f"  ⚠️ All search engines unavailable, using AI only")
    return ""

def gather_company_info(victim: dict) -> dict:
    """
    Gather all available information about a company
    1. Check website
    2. Web search
    Returns combined info dict
    """
    name = victim.get('post_title', '')
    website = victim.get('website', '')
    existing_desc = victim.get('description', '')
    
    info = {
        'name': name,
        'website': website,
        'existing_description': existing_desc,
        'website_info': {},
        'search_results': '',
        'combined_text': ''
    }
    
    # 1. Scrape website if available
    if website:
        log(f"  🌐 Checking website: {website}")
        info['website_info'] = scrape_website(website)
        if info['website_info']['success']:
            log(f"  ✅ Website scraped successfully")
    
    # 2. Web search for more info
    search_query = f"{name} company"
    if website:
        # Extract domain for better search
        try:
            domain = urlparse(website if website.startswith('http') else 'https://' + website).netloc
            search_query = f"{name} {domain}"
        except:
            pass
    
    log(f"  🔍 Searching web for: {search_query[:40]}...")
    info['search_results'] = web_search(search_query)
    if info['search_results']:
        log(f"  ✅ Search results found")
    
    # Combine all gathered text
    combined_parts = []
    
    if info['website_info'].get('title'):
        combined_parts.append(f"Website title: {info['website_info']['title']}")
    if info['website_info'].get('description'):
        combined_parts.append(f"Meta description: {info['website_info']['description']}")
    if info['website_info'].get('about_text'):
        combined_parts.append(f"About: {info['website_info']['about_text'][:500]}")
    if info['website_info'].get('contact_info'):
        combined_parts.append(f"Contact: {info['website_info']['contact_info']}")
    if info['search_results']:
        combined_parts.append(f"Web search: {info['search_results']}")
    if existing_desc:
        combined_parts.append(f"Existing info: {existing_desc}")
    
    info['combined_text'] = "\n".join(combined_parts)
    
    return info

# ═══════════════════════════════════════════════════════════════════════════════
# AI ENRICHMENT FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def get_enrichment_from_ai(client, name: str, gathered_info: str, missing_fields: list) -> dict:
    """
    Single AI call to get all missing information
    Uses gathered web info for better accuracy
    """
    result = {'country': '', 'activity': '', 'description': ''}
    
    if not missing_fields:
        return result
    
    try:
        prompt = f"""Analyze this company and provide the requested information.

COMPANY NAME: {name}

GATHERED INFORMATION:
{gathered_info[:2000] if gathered_info else 'No additional information available'}

REQUIRED FIELDS: {', '.join(missing_fields)}

SECTOR LIST (use only these for activity): {', '.join(SECTOR_LIST)}

RESPOND IN THIS EXACT FORMAT (one per line):
COUNTRY: [2-letter ISO country code like US, DE, FR, GB, or UNKNOWN]
ACTIVITY: [One sector from the list above, or Not Found]
DESCRIPTION: [Brief 1-2 sentence description of what the company does, or N/A]

Be precise. Use the gathered information to determine the answers."""

        response = client.chat.completions.create(
            model=LM_STUDIO_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.1
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Parse response
        for line in response_text.split('\n'):
            line = line.strip()
            
            if line.upper().startswith('COUNTRY:'):
                country = line.split(':', 1)[1].strip().upper()
                country = ''.join(c for c in country if c.isalpha())[:2]
                if len(country) == 2 and country not in ['XX', 'UN', 'NA']:
                    try:
                        pycountry.countries.get(alpha_2=country)
                        result['country'] = country
                    except:
                        pass
            
            elif line.upper().startswith('ACTIVITY:'):
                activity = line.split(':', 1)[1].strip()
                for sector in SECTOR_LIST:
                    if sector.lower() in activity.lower():
                        result['activity'] = sector
                        break
            
            elif line.upper().startswith('DESCRIPTION:'):
                desc = line.split(':', 1)[1].strip()
                if desc and desc.lower() not in ['n/a', 'na', 'unknown', 'not found']:
                    result['description'] = "[AI] " + desc[:400]
        
    except Exception as e:
        log(f"  ⚠️ AI error: {str(e)[:50]}")
    
    return result

def needs_enrichment(victim: dict) -> dict:
    """Check which fields need enrichment"""
    needs = {
        'country': not victim.get('country') or len(str(victim.get('country', ''))) < 2,
        'activity': not victim.get('activity') or victim.get('activity') == "Not Found" or victim.get('activity') == "",
        'description': not victim.get('description') or len(str(victim.get('description', ''))) < 5
    }
    return needs

def enrich_victim(client, victim: dict, enrich_fields: dict, use_web: bool = True) -> tuple:
    """
    Enrich a single victim record
    1. Gather info from web
    2. Use AI to analyze
    """
    name = victim.get('post_title', '')
    
    # Gather web info if enabled
    gathered_info = ""
    if use_web:
        info = gather_company_info(victim)
        gathered_info = info['combined_text']
    
    # Determine which fields to request from AI
    missing_fields = [k for k, v in enrich_fields.items() if v]
    
    if not missing_fields:
        return victim, False
    
    # Get AI enrichment
    log(f"  🤖 Analyzing with AI...")
    ai_result = get_enrichment_from_ai(client, name, gathered_info, missing_fields)
    
    enriched = False
    
    # Apply results (only for requested fields)
    if enrich_fields.get('country') and ai_result['country']:
        victim['country'] = ai_result['country']
        log(f"  ✅ Country: {ai_result['country']}")
        enriched = True
    
    if enrich_fields.get('activity') and ai_result['activity']:
        victim['activity'] = ai_result['activity']
        log(f"  ✅ Activity: {ai_result['activity']}")
        enriched = True
    
    if enrich_fields.get('description') and ai_result['description']:
        victim['description'] = ai_result['description']
        log(f"  ✅ Description added")
        enriched = True
    
    return victim, enriched

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

# Global for signal handler
_victims = None
_progress = None
_interrupted = False

def signal_handler(signum, frame):
    """Handle interrupt signal - save progress before exit"""
    global _interrupted
    _interrupted = True
    log("\n⚠️ Interrupt received! Saving progress...")
    if _victims and _progress:
        # Save current state
        with open(VICTIMS_FILE, 'w', encoding='utf-8') as f:
            json.dump(_victims, f, indent=4, ensure_ascii=False)
        save_progress(_progress)
        log("✅ Progress saved! Run again to continue.")
    sys.exit(0)

def main():
    global _victims, _progress
    
    parser = argparse.ArgumentParser(description="Enrich victim records with web search + AI")
    parser.add_argument("-l", "--limit", type=int, default=50, help="Max records to process (default: 50)")
    parser.add_argument("-d", "--dry-run", action="store_true", help="Preview without saving")
    parser.add_argument("--country-only", action="store_true", help="Only enrich country field")
    parser.add_argument("--activity-only", action="store_true", help="Only enrich activity field")
    parser.add_argument("--no-backup", action="store_true", help="Skip backup creation")
    parser.add_argument("--no-web", action="store_true", help="Skip web scraping/search (AI only)")
    parser.add_argument("--website-required", action="store_true", help="Only process records with website")
    parser.add_argument("--reset", action="store_true", help="Reset progress and start from beginning")
    parser.add_argument("--continuous", action="store_true", help="Run continuously until all records are processed")
    args = parser.parse_args()

    # Setup signal handler for graceful interruption
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print("""
    ╔═══════════════════════════════════════════════════════════════════╗
    ║     🐉  DRAGONS - AI ENRICHMENT TOOL v2.0                        ║
    ║         Web Search + Website Scraping + AI Analysis               ║
    ║         Press Ctrl+C to pause and save progress                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
    """)
    
    log(f"LM Studio URL: {OPENAI_BASE_URL}")
    log(f"Model: {LM_STUDIO_MODEL}")
    log(f"Limit: {args.limit} records")
    log(f"Web search: {'❌ Disabled' if args.no_web else '✅ Enabled'}")
    
    # Handle reset
    if args.reset:
        clear_progress()
    
    # Load progress
    progress = load_progress()
    _progress = progress
    
    if progress['processed_indices']:
        log(f"📂 Resuming from previous session...")
        log(f"   Already processed: {len(progress['processed_indices'])} records")
        log(f"   Total enriched so far: {progress['total_enriched']}")
    else:
        progress['started_at'] = datetime.now().isoformat()
    
    # Disable SSL warnings for website scraping
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    # Load victims
    log(f"Loading {VICTIMS_FILE}...")
    with open(VICTIMS_FILE, 'r', encoding='utf-8') as f:
        victims = json.load(f)
    _victims = victims
    
    log(f"Total records: {len(victims)}")
    
    # Create backup (only once per session)
    if not args.dry_run and not args.no_backup and not progress['processed_indices']:
        log(f"Creating backup: {BACKUP_FILE}")
        with open(BACKUP_FILE, 'w', encoding='utf-8') as f:
            json.dump(victims, f, indent=4, ensure_ascii=False)
    
    # Create AI client
    client = create_client()
    
    # Test connection
    try:
        test = client.chat.completions.create(
            model=LM_STUDIO_MODEL,
            messages=[{"role": "user", "content": "Say OK"}],
            max_tokens=5
        )
        log("✅ LM Studio connection OK")
    except Exception as e:
        log(f"❌ LM Studio connection failed: {e}")
        sys.exit(1)
    
    # Find records that need enrichment
    already_processed = set(progress['processed_indices'])
    to_enrich = []
    
    for i, victim in enumerate(victims):
        # Skip already processed
        if i in already_processed:
            continue
        
        # Skip if website-required and no website
        if args.website_required and not victim.get('website'):
            continue
        
        needs = needs_enrichment(victim)
        
        # Filter by flags
        if args.country_only:
            needs = {'country': needs['country'], 'activity': False, 'description': False}
        elif args.activity_only:
            needs = {'country': False, 'activity': needs['activity'], 'description': False}
        
        if any(needs.values()):
            to_enrich.append((i, victim, needs))
    
    log(f"Records needing enrichment: {len(to_enrich)}")
    
    if not to_enrich:
        log("✅ All records are already enriched!")
        clear_progress()
        return
    
    # Prioritize records with website (better success rate)
    if not args.website_required:
        with_website = [(i, v, n) for i, v, n in to_enrich if v.get('website')]
        without_website = [(i, v, n) for i, v, n in to_enrich if not v.get('website')]
        to_enrich = with_website + without_website
        log(f"  📊 With website: {len(with_website)}, Without: {len(without_website)}")
    
    # Limit processing (unless continuous mode)
    if args.continuous:
        to_process = to_enrich
        log(f"🔄 Continuous mode: Processing all {len(to_process)} records")
    else:
        to_process = to_enrich[:args.limit]
        log(f"Processing {len(to_process)} records...")
    
    # Process
    enriched_count = progress['total_enriched']
    session_enriched = 0
    success_with_web = 0
    success_without_web = 0
    
    for idx, (i, victim, needs) in enumerate(to_process):
        if _interrupted:
            break
            
        name = victim.get('post_title', 'Unknown')
        website = victim.get('website', '')
        missing = [k for k, v in needs.items() if v]
        
        log(f"\n{'='*60}")
        log(f"[{idx+1}/{len(to_process)}] {name}")
        if website:
            log(f"  🌐 Website: {website}")
        log(f"  📋 Missing: {', '.join(missing)}")
        
        if args.dry_run:
            log("  [DRY RUN - skipping]")
            progress['processed_indices'].append(i)
            continue
        
        enriched_victim, was_enriched = enrich_victim(
            client, victim, needs, 
            use_web=not args.no_web
        )
        
        # Mark as processed
        progress['processed_indices'].append(i)
        progress['last_index'] = i
        
        if was_enriched:
            victims[i] = enriched_victim
            enriched_count += 1
            session_enriched += 1
            progress['total_enriched'] = enriched_count
            if website:
                success_with_web += 1
            else:
                success_without_web += 1
        
        # Auto-save every N records
        if (idx + 1) % AUTO_SAVE_INTERVAL == 0:
            log(f"\n💾 Auto-saving progress ({idx+1} records processed)...")
            with open(VICTIMS_FILE, 'w', encoding='utf-8') as f:
                json.dump(victims, f, indent=4, ensure_ascii=False)
            save_progress(progress)
            log("✅ Saved!")
        
        # Rate limiting
        time.sleep(1)
    
    # Final save
    if not args.dry_run and session_enriched > 0:
        log(f"\n💾 Saving {session_enriched} enriched records...")
        with open(VICTIMS_FILE, 'w', encoding='utf-8') as f:
            json.dump(victims, f, indent=4, ensure_ascii=False)
        save_progress(progress)
        log("✅ Saved!")
    
    # Check if all done
    remaining = len(to_enrich) - len(to_process)
    if remaining == 0:
        clear_progress()
        log("🎉 All records have been processed!")
    else:
        log(f"📊 Remaining records: {remaining}")
        log(f"   Run again to continue processing")
    
    # Summary
    processed = len(to_process) if not args.dry_run else 0
    success_rate = (session_enriched / processed * 100) if processed > 0 else 0
    
    print(f"""
    ════════════════════════════════════════════════════════════════════
    📊 SUMMARY
    ────────────────────────────────────────────────────────────────────
    Total records:        {len(victims)}
    Needed enrichment:    {len(to_enrich)}
    Processed this run:   {processed}
    Enriched this run:    {session_enriched} ({success_rate:.1f}% success)
      - With website:     {success_with_web}
      - Without website:  {success_without_web}
    
    📈 TOTAL PROGRESS
    ────────────────────────────────────────────────────────────────────
    Total processed:      {len(progress['processed_indices'])}
    Total enriched:       {enriched_count}
    Remaining:            {remaining}
    
    {'[DRY RUN - no changes saved]' if args.dry_run else '✅ Changes saved to victims.json'}
    {'💡 Run again to continue' if remaining > 0 else '🎉 All done!'}
    ════════════════════════════════════════════════════════════════════
    """)

if __name__ == "__main__":
    main()
