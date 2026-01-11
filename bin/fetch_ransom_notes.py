#!/usr/bin/env python3
"""
Fetch ransomware notes from ThreatLabz GitHub repository
https://github.com/ThreatLabz/ransomware_notes
"""

import json
import requests
import time
import uuid
from datetime import datetime
from pathlib import Path
import base64

# Paths
BASE_DIR = Path(__file__).parent.parent
DB_DIR = BASE_DIR / "db"
OUTPUT_FILE = DB_DIR / "ransom_notes.json"
BACKUP_FILE = DB_DIR / "ransom_notes_backup.json"

# GitHub API
GITHUB_API = "https://api.github.com"
REPO_OWNER = "ThreatLabz"
REPO_NAME = "ransomware_notes"
REPO_URL = f"{GITHUB_API}/repos/{REPO_OWNER}/{REPO_NAME}"

HEADERS = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'RansomHawk-Scraper/1.0'
}

# Rate limiting
REQUEST_DELAY = 0.5  # seconds between requests

def get_repo_contents(path=""):
    """Get contents of a path in the repository"""
    url = f"{REPO_URL}/contents/{path}"
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Error fetching {path}: {e}")
        return None

def get_file_content(file_info):
    """Get the content of a file"""
    try:
        if file_info.get('download_url'):
            response = requests.get(file_info['download_url'], headers=HEADERS, timeout=30)
            response.raise_for_status()
            return response.text
        elif file_info.get('content'):
            # Content is base64 encoded
            return base64.b64decode(file_info['content']).decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"  ❌ Error getting file content: {e}")
    return None

def sanitize_content(content, max_length=10000):
    """Clean and limit content length"""
    if not content:
        return ""
    
    # Remove null bytes and other problematic characters
    content = content.replace('\x00', '')
    
    # Limit length
    if len(content) > max_length:
        content = content[:max_length] + "\n\n[... Content truncated ...]"
    
    return content.strip()

def generate_note_title(group_name, filename):
    """Generate a title for the ransom note"""
    group_title = group_name.replace("_", " ").replace("-", " ").title()
    
    # Clean filename
    clean_name = filename.replace("_", " ").replace("-", " ")
    if clean_name.lower().endswith('.txt'):
        clean_name = clean_name[:-4]
    elif clean_name.lower().endswith('.html'):
        clean_name = clean_name[:-5]
    elif clean_name.lower().endswith('.hta'):
        clean_name = clean_name[:-4]
    
    return f"{group_title} - {clean_name}"

def main():
    print("=" * 60)
    print("📥 Fetching Ransomware Notes from ThreatLabz GitHub")
    print("=" * 60)
    print(f"📂 Repository: https://github.com/{REPO_OWNER}/{REPO_NAME}")
    
    # Get list of folders (each folder = ransomware group)
    print("\n🔍 Getting list of ransomware groups...")
    contents = get_repo_contents()
    
    if not contents:
        print("❌ Failed to fetch repository contents")
        return
    
    # Filter only directories (ransomware groups)
    groups = [item for item in contents if item['type'] == 'dir']
    print(f"✅ Found {len(groups)} ransomware groups")
    
    # Load existing notes for backup
    existing_notes = []
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, 'r') as f:
            existing_notes = json.load(f)
        # Create backup
        with open(BACKUP_FILE, 'w') as f:
            json.dump(existing_notes, f, indent=2)
        print(f"💾 Backup saved: {BACKUP_FILE}")
    
    # Track existing notes to avoid duplicates
    existing_keys = set()
    for note in existing_notes:
        key = f"{note['group_name'].lower()}|{note.get('filename', '').lower()}"
        existing_keys.add(key)
    
    # Fetch notes for each group
    all_notes = existing_notes.copy()
    new_count = 0
    skipped_count = 0
    error_count = 0
    
    print("\n" + "=" * 60)
    print("📝 Fetching ransom notes...")
    print("=" * 60)
    
    for i, group in enumerate(groups, 1):
        group_name = group['name']
        print(f"\n[{i}/{len(groups)}] {group_name}")
        
        # Get files in this group's folder
        time.sleep(REQUEST_DELAY)
        files = get_repo_contents(group_name)
        
        if not files:
            error_count += 1
            continue
        
        # Filter for note files (txt, html, hta)
        note_files = [f for f in files if f['type'] == 'file' and 
                     f['name'].lower().endswith(('.txt', '.html', '.hta', '.htm'))]
        
        if not note_files:
            print(f"  ⏭️ No note files found")
            continue
        
        print(f"  📄 Found {len(note_files)} note file(s)")
        
        for file_info in note_files:
            filename = file_info['name']
            key = f"{group_name.lower()}|{filename.lower()}"
            
            if key in existing_keys:
                skipped_count += 1
                print(f"     ⏭️ {filename} (already exists)")
                continue
            
            # Fetch file content
            time.sleep(REQUEST_DELAY)
            content = get_file_content(file_info)
            
            if not content:
                error_count += 1
                print(f"     ❌ {filename} (failed to fetch)")
                continue
            
            # Create note entry
            note_id = f"{group_name}-{str(uuid.uuid4())[:8]}"
            now = datetime.now().isoformat()
            
            note = {
                "id": note_id,
                "group_name": group_name,
                "note_title": generate_note_title(group_name, filename),
                "note_content": sanitize_content(content),
                "filename": filename,
                "file_extensions": [],  # Could be parsed from content
                "source_url": file_info.get('html_url', ''),
                "created_at": now,
                "updated_at": now
            }
            
            all_notes.append(note)
            existing_keys.add(key)
            new_count += 1
            print(f"     ✅ {filename}")
    
    # Sort by group name
    all_notes.sort(key=lambda x: x['group_name'].lower())
    
    # Save to output file
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(all_notes, f, indent=2, ensure_ascii=False)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Summary")
    print("=" * 60)
    print(f"✅ New notes added: {new_count}")
    print(f"⏭️ Skipped (already exist): {skipped_count}")
    print(f"❌ Errors: {error_count}")
    print(f"\n📁 Total notes in database: {len(all_notes)}")
    print(f"📂 Saved to: {OUTPUT_FILE}")
    
    # Print groups with notes
    groups_with_notes = set(n['group_name'] for n in all_notes)
    print(f"\n🔐 Ransomware groups with notes: {len(groups_with_notes)}")
    
    # Top 10 groups by note count
    group_counts = {}
    for note in all_notes:
        g = note['group_name']
        group_counts[g] = group_counts.get(g, 0) + 1
    
    print("\n📈 Top 10 groups by note count:")
    for group, count in sorted(group_counts.items(), key=lambda x: -x[1])[:10]:
        print(f"   {group}: {count} note(s)")

if __name__ == "__main__":
    main()

