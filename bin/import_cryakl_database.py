#!/usr/bin/env python3
"""
Import ransomware data from Cryakl/Ransomware-Database
https://github.com/Cryakl/Ransomware-Database

Extracts:
- Ransom notes content
- File extensions
- Note filenames
"""

import json
import re
import uuid
from datetime import datetime
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent
DB_DIR = BASE_DIR / "db"
NOTES_FILE = DB_DIR / "ransom_notes.json"
GROUPS_FILE = DB_DIR / "groups.json"
ENRICHMENT_FILE = DB_DIR / "cryakl_enrichment.json"

# Cloned repo path
REPO_PATH = Path("/tmp/Ransomware-Database")

def parse_readme(readme_path):
    """Parse README.md file to extract ransomware data"""
    try:
        content = readme_path.read_text(encoding='utf-8', errors='ignore')
    except:
        return None
    
    data = {
        'extensions': [],
        'note_filenames': [],
        'ransom_notes': [],
        'screenshots': []
    }
    
    # Extract extensions
    ext_match = re.search(r'Extension\(s\):\s*```([^`]+)```', content, re.DOTALL)
    if ext_match:
        exts = ext_match.group(1).strip().split('\n')
        data['extensions'] = [e.strip() for e in exts if e.strip()]
    
    # Extract ransom note filenames
    filename_match = re.search(r'Ransom Note\(s\):\s*```([^`]+)```', content, re.DOTALL)
    if filename_match:
        filenames = filename_match.group(1).strip().split('\n')
        data['note_filenames'] = [f.strip() for f in filenames if f.strip()]
    
    # Extract ransom note content - everything after the filename block until next section or end
    # The structure is: filename block, then note content in next ``` block
    parts = content.split('```')
    
    # Find note content blocks (usually after the filename block)
    note_content_started = False
    for i, part in enumerate(parts):
        if 'Ransom Note' in part:
            note_content_started = True
            continue
        
        if note_content_started and part.strip():
            # Skip the filename part
            if any(data['note_filenames']) and any(fn in part for fn in data['note_filenames']):
                continue
            
            # This should be the note content
            note_text = part.strip()
            if len(note_text) > 50 and any(kw in note_text.lower() for kw in 
                ['encrypt', 'decrypt', 'bitcoin', 'ransom', 'files', 'pay', 'contact', 'tor', 'onion', 'key']):
                data['ransom_notes'].append(note_text)
    
    # Alternative parsing - look for large text blocks that look like ransom notes
    if not data['ransom_notes']:
        for part in parts:
            text = part.strip()
            if len(text) > 200:
                keywords = ['encrypt', 'decrypt', 'bitcoin', 'btc', 'ransom', 'pay', 
                           'contact', 'tor', 'onion', 'key', 'files', 'restore', 'recover']
                if sum(1 for kw in keywords if kw in text.lower()) >= 3:
                    data['ransom_notes'].append(text)
    
    return data

def normalize_group_name(name):
    """Normalize group name for matching"""
    return name.lower().replace(' ', '').replace('-', '').replace('_', '').replace('.', '')

def main():
    print("=" * 60)
    print("📥 Importing from Cryakl/Ransomware-Database")
    print("=" * 60)
    print(f"📂 Source: {REPO_PATH}")
    
    if not REPO_PATH.exists():
        print("❌ Repository not found! Clone it first:")
        print("   git clone https://github.com/Cryakl/Ransomware-Database.git /tmp/Ransomware-Database")
        return
    
    # Load existing notes
    existing_notes = []
    if NOTES_FILE.exists():
        with open(NOTES_FILE, 'r') as f:
            existing_notes = json.load(f)
        print(f"📊 Existing notes: {len(existing_notes)}")
    
    # Load existing groups for enrichment
    existing_groups = []
    if GROUPS_FILE.exists():
        with open(GROUPS_FILE, 'r') as f:
            existing_groups = json.load(f)
        print(f"📊 Existing groups: {len(existing_groups)}")
    
    # Track existing notes
    existing_keys = set()
    for note in existing_notes:
        key = f"{normalize_group_name(note['group_name'])}|cryakl"
        existing_keys.add(key)
    
    # Get all group folders
    groups = [d for d in REPO_PATH.iterdir() if d.is_dir() and not d.name.startswith('.')]
    groups.sort(key=lambda x: x.name.lower())
    
    print(f"🔍 Found {len(groups)} ransomware folders")
    
    # Process each group
    all_enrichment = []
    new_notes = []
    groups_enriched = 0
    
    print("\n" + "=" * 60)
    print("📝 Processing ransomware data...")
    print("=" * 60)
    
    for i, group_dir in enumerate(groups, 1):
        group_name = group_dir.name
        
        # Find README.md (case insensitive)
        readme_files = list(group_dir.glob('README.md')) + list(group_dir.glob('readme.md'))
        
        # Also check subdirectories
        for subdir in group_dir.iterdir():
            if subdir.is_dir():
                readme_files.extend(subdir.glob('README.md'))
                readme_files.extend(subdir.glob('readme.md'))
        
        if not readme_files:
            continue
        
        print(f"\n[{i}/{len(groups)}] {group_name}")
        
        for readme_path in readme_files:
            data = parse_readme(readme_path)
            if not data:
                continue
            
            # Determine subgroup name if in subdirectory
            if readme_path.parent != group_dir:
                subgroup = f"{group_name}/{readme_path.parent.name}"
            else:
                subgroup = group_name
            
            # Store enrichment data
            enrichment = {
                'name': subgroup,
                'normalized_name': normalize_group_name(subgroup),
                'extensions': data['extensions'],
                'note_filenames': data['note_filenames'],
                'source': f"https://github.com/Cryakl/Ransomware-Database/tree/main/{group_name}"
            }
            all_enrichment.append(enrichment)
            
            if data['extensions']:
                print(f"  📎 Extensions: {', '.join(data['extensions'][:5])}")
            
            # Create ransom note entries
            key = f"{normalize_group_name(subgroup)}|cryakl"
            if key not in existing_keys and data['ransom_notes']:
                for idx, note_content in enumerate(data['ransom_notes'][:3]):  # Max 3 notes per group
                    note_id = f"cryakl-{normalize_group_name(subgroup)}-{str(uuid.uuid4())[:8]}"
                    
                    # Get filename
                    filename = data['note_filenames'][idx] if idx < len(data['note_filenames']) else "README.txt"
                    
                    note = {
                        "id": note_id,
                        "group_name": subgroup.lower().replace('/', '-'),
                        "note_title": f"{subgroup} - Cryakl Database",
                        "note_content": note_content[:15000],  # Limit length
                        "filename": filename,
                        "file_extensions": data['extensions'],
                        "source_url": enrichment['source'],
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                    new_notes.append(note)
                    print(f"  ✅ Note: {filename} ({len(note_content)} chars)")
                
                existing_keys.add(key)
            
            # Enrich existing groups
            normalized = normalize_group_name(subgroup)
            for group in existing_groups:
                group_normalized = normalize_group_name(group.get('name', ''))
                if group_normalized == normalized or normalized in group_normalized or group_normalized in normalized:
                    # Add extensions if missing
                    if data['extensions'] and not group.get('extensions'):
                        group['extensions'] = data['extensions']
                        groups_enriched += 1
                        print(f"  🔄 Enriched group: {group.get('name')}")
    
    # Save enrichment data
    with open(ENRICHMENT_FILE, 'w') as f:
        json.dump({
            'source': 'https://github.com/Cryakl/Ransomware-Database',
            'fetched_at': datetime.now().isoformat(),
            'groups': all_enrichment
        }, f, indent=2, ensure_ascii=False)
    print(f"\n💾 Enrichment data saved: {ENRICHMENT_FILE}")
    
    # Merge new notes
    if new_notes:
        all_notes = existing_notes + new_notes
        all_notes.sort(key=lambda x: x['group_name'].lower())
        
        with open(NOTES_FILE, 'w') as f:
            json.dump(all_notes, f, indent=2, ensure_ascii=False)
        print(f"✅ Added {len(new_notes)} new ransom notes")
    
    # Save enriched groups
    if groups_enriched > 0:
        with open(GROUPS_FILE, 'w') as f:
            json.dump(existing_groups, f, indent=2, ensure_ascii=False)
        print(f"🔄 Enriched {groups_enriched} groups with extensions")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Summary")
    print("=" * 60)
    print(f"📁 Folders processed: {len(groups)}")
    print(f"📝 Groups with data: {len(all_enrichment)}")
    print(f"✅ New notes added: {len(new_notes)}")
    print(f"🔄 Groups enriched: {groups_enriched}")
    print(f"📁 Total notes now: {len(existing_notes) + len(new_notes)}")
    
    # Top extensions found
    all_exts = []
    for e in all_enrichment:
        all_exts.extend(e['extensions'])
    
    ext_counts = {}
    for ext in all_exts:
        ext_counts[ext] = ext_counts.get(ext, 0) + 1
    
    print(f"\n📎 Unique extensions found: {len(set(all_exts))}")
    print("Top 10 extensions:")
    for ext, count in sorted(ext_counts.items(), key=lambda x: -x[1])[:10]:
        print(f"   {ext}: {count} groups")

if __name__ == "__main__":
    main()

