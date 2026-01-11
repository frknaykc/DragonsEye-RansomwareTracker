#!/usr/bin/env python3
"""
Download actual PDF how-to guides from NoMoreRansom
"""

import json
import os
import re
import time
import requests
from pathlib import Path
from bs4 import BeautifulSoup

# Paths
BASE_DIR = Path(__file__).parent.parent
GUIDES_DIR = BASE_DIR / "static" / "guides"
IMPORT_FILE = BASE_DIR / "db" / "decryptors_import.json"
OUTPUT_FILE = BASE_DIR / "db" / "decryptors_with_guides.json"

# Create guides directory
GUIDES_DIR.mkdir(parents=True, exist_ok=True)

# Headers
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

# NoMoreRansom base URL
NMR_BASE = "https://www.nomoreransom.org"

def sanitize_filename(name):
    """Create safe filename"""
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[-\s]+', '-', name)
    return name.strip('-').lower()

def download_pdf(url, filepath):
    """Download PDF file"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=30, allow_redirects=True)
        response.raise_for_status()
        
        # Check if it's actually a PDF
        content_type = response.headers.get('content-type', '')
        if 'pdf' not in content_type.lower() and not url.lower().endswith('.pdf'):
            print(f"  ⚠️ Not a PDF: {content_type}")
            return False
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        # Verify file size
        if os.path.getsize(filepath) < 1000:  # Less than 1KB probably error
            os.remove(filepath)
            return False
            
        return True
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def get_pdf_links_from_nmr():
    """Scrape NoMoreRansom to get actual PDF links"""
    print("🔍 Scraping NoMoreRansom for PDF links...")
    
    url = f"{NMR_BASE}/en/decryption-tools.html"
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        pdf_links = {}
        
        # Find all decryptor entries
        for item in soup.find_all('li'):
            # Get ransomware name from h2
            h2 = item.find('h2')
            if not h2:
                continue
            
            ransom_name = h2.get_text(strip=True).replace(' Ransom', '').strip()
            
            # Find all links in this item
            links = item.find_all('a', href=True)
            for link in links:
                href = link['href']
                text = link.get_text(strip=True).lower()
                
                # Look for "how-to guide" links
                if 'how-to' in text or 'guide' in text:
                    if href.startswith('/'):
                        href = NMR_BASE + href
                    
                    if ransom_name not in pdf_links:
                        pdf_links[ransom_name] = []
                    pdf_links[ransom_name].append(href)
                    
                # Also look for PDF links directly
                elif '.pdf' in href.lower():
                    if href.startswith('/'):
                        href = NMR_BASE + href
                    
                    if ransom_name not in pdf_links:
                        pdf_links[ransom_name] = []
                    pdf_links[ransom_name].append(href)
        
        print(f"✅ Found PDF links for {len(pdf_links)} ransomware families")
        return pdf_links
        
    except Exception as e:
        print(f"❌ Error scraping: {e}")
        return {}

def main():
    print("=" * 60)
    print("📥 Downloading PDF How-To Guides from NoMoreRansom")
    print("=" * 60)
    
    # First, get PDF links from NoMoreRansom
    pdf_links = get_pdf_links_from_nmr()
    
    # Load our decryptor data
    with open(IMPORT_FILE, 'r') as f:
        data = json.load(f)
    
    decryptors = data['decryptors']
    downloaded = 0
    failed = 0
    
    # Track downloaded PDFs to avoid duplicates
    downloaded_pdfs = {}
    
    print("\n" + "=" * 60)
    print("📄 Downloading PDFs...")
    print("=" * 60)
    
    for i, decryptor in enumerate(decryptors, 1):
        group = decryptor['group_name']
        name = decryptor['decryptor_name']
        
        print(f"\n[{i}/{len(decryptors)}] {group} - {name}")
        
        # Check if we have PDF links for this group
        pdf_urls = pdf_links.get(group, [])
        
        if not pdf_urls:
            # Try variations of the name
            for key in pdf_links.keys():
                if group.lower() in key.lower() or key.lower() in group.lower():
                    pdf_urls = pdf_links[key]
                    break
        
        if not pdf_urls:
            print("  ⏭️ No PDF found")
            continue
        
        # Download first available PDF
        for pdf_url in pdf_urls:
            if not pdf_url.endswith('.pdf'):
                continue
                
            if pdf_url in downloaded_pdfs:
                print(f"  ♻️ Reusing: {downloaded_pdfs[pdf_url]}")
                decryptor['local_guide_path'] = downloaded_pdfs[pdf_url]
                decryptor['how_to_guide_type'] = 'pdf'
                break
            
            safe_name = sanitize_filename(f"{group}-guide")
            filename = f"{safe_name}.pdf"
            filepath = GUIDES_DIR / filename
            
            print(f"  📄 Downloading: {pdf_url}")
            
            if download_pdf(pdf_url, filepath):
                downloaded += 1
                local_path = f"/static/guides/{filename}"
                decryptor['local_guide_path'] = local_path
                decryptor['how_to_guide_type'] = 'pdf'
                downloaded_pdfs[pdf_url] = local_path
                print(f"  ✅ Saved: {filename} ({os.path.getsize(filepath) / 1024:.1f} KB)")
                break
            else:
                failed += 1
        
        time.sleep(0.3)
    
    # Also download common vendor PDFs directly
    print("\n" + "=" * 60)
    print("📄 Downloading common vendor guide PDFs...")
    print("=" * 60)
    
    common_pdfs = [
        ("https://www.nomoreransom.org/uploads/RakhniDecryptor_HowTo.pdf", "kaspersky-rakhni-guide.pdf"),
        ("https://www.nomoreransom.org/uploads/RannohDecryptor_HowTo.pdf", "kaspersky-rannoh-guide.pdf"),
        ("https://www.nomoreransom.org/uploads/ShadeDecryptor_HowTo.pdf", "kaspersky-shade-guide.pdf"),
        ("https://www.nomoreransom.org/uploads/WildfireDecryptor_HowTo.pdf", "kaspersky-wildfire-guide.pdf"),
        ("https://www.nomoreransom.org/uploads/CoinvaultDecryptor_HowTo.pdf", "kaspersky-coinvault-guide.pdf"),
    ]
    
    for pdf_url, filename in common_pdfs:
        filepath = GUIDES_DIR / filename
        if filepath.exists():
            print(f"  ⏭️ Already exists: {filename}")
            continue
            
        print(f"  📄 Downloading: {filename}")
        if download_pdf(pdf_url, filepath):
            downloaded += 1
            print(f"  ✅ Saved: {filename}")
        else:
            print(f"  ❌ Failed: {filename}")
    
    # Save updated data
    data['decryptors'] = decryptors
    data['guides_downloaded_at'] = time.strftime('%Y-%m-%d %H:%M:%S')
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    
    print("\n" + "=" * 60)
    print("📊 Summary")
    print("=" * 60)
    print(f"✅ PDFs Downloaded: {downloaded}")
    print(f"❌ Failed: {failed}")
    print(f"\n📁 PDFs saved to: {GUIDES_DIR}")
    
    # List downloaded PDFs
    pdf_files = list(GUIDES_DIR.glob("*.pdf"))
    if pdf_files:
        print(f"\n📄 PDF Files ({len(pdf_files)}):")
        for pdf in sorted(pdf_files):
            size = os.path.getsize(pdf) / 1024
            print(f"   - {pdf.name} ({size:.1f} KB)")

if __name__ == "__main__":
    main()

