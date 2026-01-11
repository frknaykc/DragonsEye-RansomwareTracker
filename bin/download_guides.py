#!/usr/bin/env python3
"""
Download decryptor how-to guides from various sources
"""

import json
import os
import re
import time
import requests
from pathlib import Path
from urllib.parse import urlparse, unquote

# Paths
BASE_DIR = Path(__file__).parent.parent
GUIDES_DIR = BASE_DIR / "static" / "guides"
IMPORT_FILE = BASE_DIR / "db" / "decryptors_import.json"
OUTPUT_FILE = BASE_DIR / "db" / "decryptors_with_guides.json"

# Create guides directory
GUIDES_DIR.mkdir(parents=True, exist_ok=True)

# Headers for requests
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def sanitize_filename(name):
    """Create safe filename"""
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[-\s]+', '-', name)
    return name.strip('-').lower()

def download_file(url, filepath):
    """Download a file from URL"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=30, allow_redirects=True)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        return True
    except Exception as e:
        print(f"  ❌ Error downloading {url}: {e}")
        return False

def download_page_as_html(url, filepath):
    """Download web page as HTML"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        # Save as HTML
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        return True
    except Exception as e:
        print(f"  ❌ Error downloading page {url}: {e}")
        return False

def get_guide_type(url):
    """Determine guide type from URL"""
    url_lower = url.lower()
    if '.pdf' in url_lower:
        return 'pdf'
    elif 'github.com' in url_lower:
        return 'github'
    else:
        return 'html'

def main():
    print("=" * 60)
    print("📥 Downloading Decryptor How-To Guides")
    print("=" * 60)
    
    # Load import file
    with open(IMPORT_FILE, 'r') as f:
        data = json.load(f)
    
    decryptors = data['decryptors']
    total = len(decryptors)
    downloaded = 0
    failed = 0
    skipped = 0
    
    # Track unique URLs to avoid duplicate downloads
    downloaded_urls = {}
    
    for i, decryptor in enumerate(decryptors, 1):
        group = decryptor['group_name']
        name = decryptor['decryptor_name']
        guide_url = decryptor.get('how_to_guide_url', '')
        
        print(f"\n[{i}/{total}] {group} - {name}")
        
        if not guide_url:
            print("  ⏭️ No guide URL")
            skipped += 1
            continue
        
        # Check if already downloaded
        if guide_url in downloaded_urls:
            print(f"  ♻️ Already downloaded, reusing: {downloaded_urls[guide_url]}")
            decryptor['local_guide_path'] = downloaded_urls[guide_url]
            continue
        
        guide_type = get_guide_type(guide_url)
        safe_name = sanitize_filename(f"{group}-{name}")
        
        if guide_type == 'pdf':
            filename = f"{safe_name}.pdf"
            filepath = GUIDES_DIR / filename
            print(f"  📄 Downloading PDF: {guide_url}")
            
            if download_file(guide_url, filepath):
                downloaded += 1
                local_path = f"/static/guides/{filename}"
                decryptor['local_guide_path'] = local_path
                decryptor['how_to_guide_type'] = 'pdf'
                downloaded_urls[guide_url] = local_path
                print(f"  ✅ Saved: {filename}")
            else:
                failed += 1
                
        elif guide_type == 'github':
            # For GitHub, keep the URL as-is (it's a repository)
            print(f"  🔗 GitHub repo - keeping URL: {guide_url}")
            decryptor['how_to_guide_type'] = 'url'
            skipped += 1
            
        else:
            # HTML page
            filename = f"{safe_name}.html"
            filepath = GUIDES_DIR / filename
            print(f"  🌐 Downloading HTML: {guide_url}")
            
            if download_page_as_html(guide_url, filepath):
                downloaded += 1
                local_path = f"/static/guides/{filename}"
                decryptor['local_guide_path'] = local_path
                decryptor['how_to_guide_type'] = 'url'  # Still URL type but we have local copy
                downloaded_urls[guide_url] = local_path
                print(f"  ✅ Saved: {filename}")
            else:
                failed += 1
        
        # Rate limiting
        time.sleep(0.5)
    
    # Save updated data
    data['decryptors'] = decryptors
    data['guides_downloaded_at'] = time.strftime('%Y-%m-%d %H:%M:%S')
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    
    print("\n" + "=" * 60)
    print("📊 Summary")
    print("=" * 60)
    print(f"✅ Downloaded: {downloaded}")
    print(f"❌ Failed: {failed}")
    print(f"⏭️ Skipped: {skipped}")
    print(f"\n📁 Guides saved to: {GUIDES_DIR}")
    print(f"📄 Updated data: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()

