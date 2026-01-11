#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🐉 Dragons Eye - Status Monitor
Run this to check the current status of the scraping system.

Usage:
    python3 status.py          # Quick status
    python3 status.py -v       # Verbose status
    python3 status.py --watch  # Live monitoring
"""

import json
import os
import sys
import time
import argparse
from datetime import datetime, timedelta
from pathlib import Path

# Load environment
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Get base directory
BASE_DIR = Path(__file__).parent.parent
home = os.getenv("DRAGONS_HOME", str(BASE_DIR))

# Handle paths - remove leading slash from env vars if present
db_env = os.getenv("DB_DIR", "/db").lstrip('/')
tmp_env = os.getenv("TMP_DIR", "/tmp").lstrip('/')

db_dir = Path(home) / db_env
tmp_dir = Path(home) / tmp_env
logs_dir = Path(home) / "logs"

def get_file_age(filepath):
    """Get file age in human readable format"""
    if not filepath.exists():
        return "N/A", None
    
    mtime = datetime.fromtimestamp(filepath.stat().st_mtime)
    age = datetime.now() - mtime
    
    if age.total_seconds() < 60:
        return f"{int(age.total_seconds())}s ago", mtime
    elif age.total_seconds() < 3600:
        return f"{int(age.total_seconds()/60)}m ago", mtime
    elif age.total_seconds() < 86400:
        return f"{int(age.total_seconds()/3600)}h ago", mtime
    else:
        return f"{int(age.total_seconds()/86400)}d ago", mtime

def check_api_status():
    """Check if API is running and get status"""
    try:
        import requests
        resp = requests.get("http://localhost:8000/api/v1/status", timeout=5)
        return resp.json()
    except:
        return None

def count_html_status():
    """Count HTML files and their status"""
    html_files = list(tmp_dir.glob("*.html"))
    
    protection_count = 0
    real_data_count = 0
    
    protection_keywords = ['captcha', 'ddos protection', 'cloudflare', 'please wait']
    
    for html_file in html_files:
        try:
            with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(10000).lower()  # Read first 10KB
            
            is_protection = any(kw in content for kw in protection_keywords)
            if is_protection:
                protection_count += 1
            else:
                real_data_count += 1
        except:
            pass
    
    return len(html_files), real_data_count, protection_count

def get_recent_victims(limit=5):
    """Get most recent victims"""
    victims_file = db_dir / "victims.json"
    if not victims_file.exists():
        return []
    
    try:
        with open(victims_file) as f:
            victims = json.load(f)
        
        # Sort by discovered date
        victims.sort(key=lambda x: x.get('discovered', ''), reverse=True)
        return victims[:limit]
    except:
        return []

def get_scheduler_status():
    """Get scheduler status"""
    status_file = tmp_dir / "scheduler_status.json"
    if not status_file.exists():
        return None
    
    try:
        with open(status_file) as f:
            return json.load(f)
    except:
        return None

def print_status(verbose=False):
    """Print current status"""
    print("\n" + "="*70)
    print("🐉 DRAGONS EYE - SISTEM DURUMU")
    print("="*70)
    print(f"⏰ Kontrol zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # API Status
    print("📡 API DURUMU:")
    api_status = check_api_status()
    if api_status:
        update_progress = api_status.get('update_in_progress', False)
        scheduler = api_status.get('scheduler', {})
        
        if update_progress:
            print("   🔄 UPDATE DEVAM EDİYOR...")
        else:
            print("   ✅ API Çalışıyor")
        
        print(f"   📊 Data Freshness: {api_status.get('data_freshness', 'N/A')}")
        print(f"   📁 Victims Age: {api_status.get('victims', {}).get('age_human', 'N/A')}")
        print(f"   🕐 Scheduler: {scheduler.get('status', 'N/A')}")
        
        if scheduler.get('last_scrape'):
            print(f"   ✅ Last Scrape: {scheduler.get('last_scrape', 'N/A')[:19]}")
        if scheduler.get('last_parse'):
            print(f"   ✅ Last Parse: {scheduler.get('last_parse', 'N/A')[:19]}")
    else:
        print("   ❌ API ÇALIŞMIYOR!")
    print()
    
    # HTML Files Status
    print("📄 HTML DOSYALARI:")
    total, real, protection = count_html_status()
    print(f"   📋 Toplam: {total} dosya")
    print(f"   ✅ Gerçek Veri: {real} dosya")
    print(f"   🛡️ Koruma Sayfası: {protection} dosya")
    
    if total > 0:
        success_rate = (real / total) * 100
        print(f"   📈 Başarı Oranı: {success_rate:.1f}%")
    print()
    
    # Victims
    print("👥 VERİTABANI:")
    victims_file = db_dir / "victims.json"
    groups_file = db_dir / "groups.json"
    
    if victims_file.exists():
        age, mtime = get_file_age(victims_file)
        with open(victims_file) as f:
            victims = json.load(f)
        print(f"   📊 Toplam Kurban: {len(victims):,}")
        print(f"   ⏰ Son Güncelleme: {age}")
        
        # Today's victims
        today = datetime.now().strftime('%Y-%m-%d')
        today_victims = [v for v in victims if v.get('discovered', '').startswith(today)]
        print(f"   🆕 Bugün Eklenen: {len(today_victims)}")
    else:
        print("   ❌ victims.json bulunamadı!")
    
    if groups_file.exists():
        with open(groups_file) as f:
            groups = json.load(f)
        active_groups = sum(1 for g in groups if any(loc.get('available') for loc in g.get('locations', [])))
        print(f"   🏴 Toplam Grup: {len(groups)} ({active_groups} aktif)")
    print()
    
    # Recent Victims
    if verbose:
        print("📋 SON EKLENEN KURBANLAR:")
        recent = get_recent_victims(10)
        for v in recent:
            group = v.get('group_name', 'N/A').upper()
            name = v.get('post_title', 'N/A')[:35]
            country = v.get('country', '??')
            discovered = v.get('discovered', '')[:16]
            print(f"   • [{group}] {name} ({country}) - {discovered}")
        print()
    
    # Log files
    print("📝 LOG DOSYALARI:")
    update_log = logs_dir / "update_latest.log"
    if update_log.exists():
        age, _ = get_file_age(update_log)
        # Get last few lines
        with open(update_log, 'r') as f:
            lines = f.readlines()[-5:]
        print(f"   📄 update_latest.log ({age}):")
        for line in lines:
            line = line.strip()[:70]
            if line:
                print(f"      {line}")
    print()
    
    print("="*70)
    print("📌 KOMUTLAR:")
    print("   • Verbose: python3 bin/status.py -v")
    print("   • Watch:   python3 bin/status.py --watch")
    print("   • Log:     tail -f logs/update_latest.log")
    print("="*70 + "\n")

def watch_mode():
    """Continuous monitoring"""
    try:
        while True:
            os.system('clear' if os.name != 'nt' else 'cls')
            print_status(verbose=True)
            print("\n🔄 Refreshing in 10 seconds... (Ctrl+C to exit)")
            time.sleep(10)
    except KeyboardInterrupt:
        print("\n👋 Monitoring stopped.")

def main():
    parser = argparse.ArgumentParser(description="Dragons Eye Status Monitor")
    parser.add_argument('-v', '--verbose', action='store_true', help='Show verbose output')
    parser.add_argument('--watch', action='store_true', help='Continuous monitoring mode')
    args = parser.parse_args()
    
    if args.watch:
        watch_mode()
    else:
        print_status(verbose=args.verbose)

if __name__ == "__main__":
    main()
