#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🐉 Ransomware Group Logo Scraper
Scrapes logos/favicons from ransomware group leak sites via Tor
"""

import json
import asyncio
import hashlib
import base64
import ssl
import os
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse
from io import BytesIO

import aiohttp
from aiohttp_socks import ProxyConnector
import aiofiles
from PIL import Image as PILImage
from dotenv import load_dotenv

# Load environment (optional - don't fail if .env doesn't exist)
env_path = Path(__file__).parent.parent / ".env"
try:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
except Exception:
    pass  # Ignore env loading errors

home = os.getenv("DRAGONS_HOME", os.getenv("RANSOMWARELIVE_HOME", str(Path(__file__).parent.parent)))
BASE_DIR = Path(home)
TMP_DIR = BASE_DIR / "tmp"
LOGOS_DIR = BASE_DIR / "images" / "logos"
GROUP_LOGOS_DIR = BASE_DIR / "images" / "groups"
GROUPS_FILE = TMP_DIR / "groups.json"

# Ensure directories exist
LOGOS_DIR.mkdir(parents=True, exist_ok=True)
GROUP_LOGOS_DIR.mkdir(parents=True, exist_ok=True)

# Proxy settings
PROXY_URL = "socks5://127.0.0.1:9050"
TIMEOUT = aiohttp.ClientTimeout(total=60)

def stdlog(msg):
    print(f"[LOG] {msg}")

def errlog(msg):
    print(f"[ERR] {msg}", file=sys.stderr)


async def fetch_html(url: str) -> str:
    """Fetch HTML content via Tor"""
    connector = ProxyConnector.from_url(PROXY_URL)
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0"
    }
    
    try:
        async with aiohttp.ClientSession(connector=connector, timeout=TIMEOUT) as session:
            async with session.get(url, headers=headers, ssl=ssl_context) as response:
                if response.status == 200:
                    return await response.text()
    except Exception as e:
        errlog(f"Failed to fetch {url}: {str(e)[:100]}")
    return ""


async def download_image(url: str, session: aiohttp.ClientSession, ssl_context) -> bytes:
    """Download image bytes"""
    try:
        async with session.get(url, ssl=ssl_context, timeout=TIMEOUT) as response:
            if response.status == 200:
                content_type = response.headers.get('content-type', '')
                if 'image' in content_type or url.endswith(('.png', '.jpg', '.jpeg', '.ico', '.svg', '.gif', '.webp')):
                    return await response.read()
    except Exception as e:
        pass
    return b""


def extract_logo_urls_from_html(html: str, base_url: str) -> list:
    """Extract potential logo URLs from HTML"""
    from bs4 import BeautifulSoup
    
    logo_urls = []
    soup = BeautifulSoup(html, 'html.parser')
    
    # 1. Favicon links
    favicon_selectors = [
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="apple-touch-icon"]',
        'link[rel="apple-touch-icon-precomposed"]',
    ]
    for selector in favicon_selectors:
        for link in soup.select(selector):
            href = link.get('href')
            if href:
                logo_urls.append(('favicon', urljoin(base_url, href)))
    
    # 2. Logo images (by class/id name)
    logo_keywords = ['logo', 'brand', 'header-image', 'site-logo', 'navbar-brand']
    for img in soup.find_all('img'):
        img_class = ' '.join(img.get('class', []))
        img_id = img.get('id', '')
        img_alt = img.get('alt', '')
        img_src = img.get('src', '')
        
        if any(kw in (img_class + img_id + img_alt).lower() for kw in logo_keywords):
            if img_src:
                logo_urls.append(('logo', urljoin(base_url, img_src)))
    
    # 3. First significant image in header/nav
    for container in soup.select('header, nav, .header, .navbar, #header, #nav'):
        for img in container.find_all('img', limit=2):
            src = img.get('src')
            if src:
                logo_urls.append(('header', urljoin(base_url, src)))
    
    # 4. Default favicon.ico
    parsed = urlparse(base_url)
    default_favicon = f"{parsed.scheme}://{parsed.netloc}/favicon.ico"
    logo_urls.append(('default', default_favicon))
    
    return logo_urls


def is_valid_image(data: bytes, min_size=100, max_size=500000) -> bool:
    """Check if data is a valid image"""
    if not data or len(data) < min_size or len(data) > max_size:
        return False
    
    # Check magic bytes
    if data[:8] == b'\x89PNG\r\n\x1a\n':  # PNG
        return True
    if data[:2] == b'\xff\xd8':  # JPEG
        return True
    if data[:6] in (b'GIF87a', b'GIF89a'):  # GIF
        return True
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP':  # WEBP
        return True
    if data[:4] == b'\x00\x00\x01\x00' or data[:4] == b'\x00\x00\x02\x00':  # ICO
        return True
    if b'<svg' in data[:500].lower():  # SVG
        return True
    
    return False


def convert_to_png(data: bytes, output_path: Path) -> bool:
    """Convert image to PNG format"""
    try:
        # Handle SVG
        if b'<svg' in data[:500].lower():
            # Save SVG directly
            with open(output_path.with_suffix('.svg'), 'wb') as f:
                f.write(data)
            return True
        
        # Handle ICO and other formats
        img = PILImage.open(BytesIO(data))
        
        # For ICO files, get the largest size
        if hasattr(img, 'n_frames') and img.format == 'ICO':
            sizes = img.info.get('sizes', [(img.width, img.height)])
            largest = max(sizes, key=lambda s: s[0] * s[1])
            img.size = largest
        
        # Convert to RGBA and save as PNG
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        img.save(output_path, 'PNG')
        return True
    except Exception as e:
        errlog(f"Failed to convert image: {e}")
        return False


async def scrape_group_logo(group_name: str, site_url: str) -> str:
    """Scrape logo for a single group"""
    stdlog(f"[{group_name}] Scraping logo from {site_url}")
    
    # Fetch HTML
    html = await fetch_html(site_url)
    if not html:
        return ""
    
    # Extract potential logo URLs
    logo_urls = extract_logo_urls_from_html(html, site_url)
    
    if not logo_urls:
        stdlog(f"[{group_name}] No logo URLs found")
        return ""
    
    # Setup session
    connector = ProxyConnector.from_url(PROXY_URL)
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    async with aiohttp.ClientSession(connector=connector, timeout=TIMEOUT) as session:
        for logo_type, url in logo_urls:
            stdlog(f"[{group_name}] Trying {logo_type}: {url[:80]}...")
            
            # Handle base64 data URLs
            if url.startswith('data:'):
                try:
                    header, b64data = url.split(',', 1)
                    data = base64.b64decode(b64data)
                    if is_valid_image(data):
                        # Generate filename
                        file_hash = hashlib.md5(data).hexdigest()[:8]
                        output_path = GROUP_LOGOS_DIR / f"{group_name.lower()}-{file_hash}.png"
                        
                        if convert_to_png(data, output_path):
                            stdlog(f"[{group_name}] ✓ Saved logo (base64): {output_path.name}")
                            return str(output_path)
                except Exception as e:
                    errlog(f"[{group_name}] Base64 decode failed: {e}")
                continue
            
            # Download image
            data = await download_image(url, session, ssl_context)
            
            if is_valid_image(data):
                # Generate filename
                file_hash = hashlib.md5(data).hexdigest()[:8]
                output_path = GROUP_LOGOS_DIR / f"{group_name.lower()}-{file_hash}.png"
                
                if convert_to_png(data, output_path):
                    stdlog(f"[{group_name}] ✓ Saved logo: {output_path.name}")
                    return str(output_path)
    
    stdlog(f"[{group_name}] No valid logo found")
    return ""


async def scrape_all_logos():
    """Scrape logos for all groups"""
    # Load groups
    if not GROUPS_FILE.exists():
        errlog(f"Groups file not found: {GROUPS_FILE}")
        return
    
    with open(GROUPS_FILE, 'r', encoding='utf-8') as f:
        groups = json.load(f)
    
    stdlog(f"Found {len(groups)} groups")
    
    results = {}
    
    for group in groups:
        name = group.get('name', '')
        locations = group.get('locations', [])
        
        if not locations:
            continue
        
        # Check if logo already exists
        existing = list(GROUP_LOGOS_DIR.glob(f"{name.lower()}-*.png"))
        existing += list(GROUP_LOGOS_DIR.glob(f"{name.lower()}-*.svg"))
        if existing:
            stdlog(f"[{name}] Logo already exists: {existing[0].name}")
            results[name] = str(existing[0])
            continue
        
        # Get first enabled location
        site_url = None
        for loc in locations:
            if loc.get('enabled'):
                site_url = loc.get('slug')
                break
        
        if not site_url:
            site_url = locations[0].get('slug')
        
        if site_url:
            try:
                logo_path = await scrape_group_logo(name, site_url)
                if logo_path:
                    results[name] = logo_path
            except Exception as e:
                errlog(f"[{name}] Error: {e}")
            
            # Small delay between groups
            await asyncio.sleep(2)
    
    # Summary
    stdlog(f"\n{'='*50}")
    stdlog(f"Logo scraping complete!")
    stdlog(f"Total groups: {len(groups)}")
    stdlog(f"Logos found: {len(results)}")
    stdlog(f"{'='*50}")
    
    return results


async def scrape_single_group(group_name: str):
    """Scrape logo for a single group by name"""
    if not GROUPS_FILE.exists():
        errlog(f"Groups file not found: {GROUPS_FILE}")
        return
    
    with open(GROUPS_FILE, 'r', encoding='utf-8') as f:
        groups = json.load(f)
    
    # Find group
    group = None
    for g in groups:
        if g.get('name', '').lower() == group_name.lower():
            group = g
            break
    
    if not group:
        errlog(f"Group not found: {group_name}")
        return
    
    locations = group.get('locations', [])
    if not locations:
        errlog(f"No locations for group: {group_name}")
        return
    
    site_url = locations[0].get('slug')
    if site_url:
        logo_path = await scrape_group_logo(group['name'], site_url)
        if logo_path:
            stdlog(f"Logo saved: {logo_path}")
        else:
            stdlog(f"No logo found for {group_name}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Scrape ransomware group logos")
    parser.add_argument("--group", "-g", help="Scrape logo for a specific group")
    parser.add_argument("--all", "-a", action="store_true", help="Scrape logos for all groups")
    args = parser.parse_args()
    
    if args.group:
        asyncio.run(scrape_single_group(args.group))
    elif args.all:
        asyncio.run(scrape_all_logos())
    else:
        print("Usage:")
        print("  python scrape_logos.py --all              # Scrape all groups")
        print("  python scrape_logos.py --group lockbit    # Scrape specific group")

