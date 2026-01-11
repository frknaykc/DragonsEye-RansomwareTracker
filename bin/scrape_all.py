#!/usr/bin/env python3
"""
🐉 Dragons-RansomwareMonitoring - Full Scraper with Checkpoint Support
Scrapes all active groups with resume capability.
"""

import os
import sys
import json
import time
import subprocess
import logging
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# ====== Configuration ======
home = os.getenv("DRAGONS_HOME", os.getenv("RANSOMWARELIVE_HOME", str(Path(__file__).parent.parent)))
HOME_PATH = Path(home)
DB_DIR = HOME_PATH / "db"
TMP_DIR = HOME_PATH / "tmp"
LOGS_DIR = HOME_PATH / "logs"
CHECKPOINT_FILE = TMP_DIR / "scrape_checkpoint.json"
PROGRESS_FILE = TMP_DIR / "scrape_progress.json"

# Create directories
TMP_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# Setup logging
log_file = LOGS_DIR / f"scrape_all_{datetime.now().strftime('%Y%m%d')}.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

BANNER = """
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║     🐉  DRAGONS - FULL SCRAPER WITH CHECKPOINT                   ║
║                                                                   ║
║     • Scrapes all active groups                                   ║
║     • Saves progress after each group                            ║
║     • Resumes from last checkpoint on restart                    ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
"""


def load_checkpoint() -> dict:
    """Load checkpoint data from file."""
    if CHECKPOINT_FILE.exists():
        try:
            with open(CHECKPOINT_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {
        "started_at": None,
        "completed_groups": [],
        "failed_groups": [],
        "current_group": None,
        "last_updated": None
    }


def save_checkpoint(checkpoint: dict):
    """Save checkpoint data to file."""
    checkpoint["last_updated"] = datetime.now().isoformat()
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(checkpoint, f, indent=2)


def update_progress(total: int, completed: int, current: str, status: str):
    """Update progress file for external monitoring."""
    progress = {
        "total_groups": total,
        "completed": completed,
        "current_group": current,
        "status": status,
        "percentage": round((completed / total) * 100, 1) if total > 0 else 0,
        "updated_at": datetime.now().isoformat()
    }
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)


def get_active_groups() -> list:
    """Get list of active groups from groups.json."""
    groups_file = DB_DIR / "groups.json"
    if not groups_file.exists():
        logger.error(f"Groups file not found: {groups_file}")
        return []
    
    with open(groups_file, 'r') as f:
        groups = json.load(f)
    
    # Filter active groups (has at least one available+enabled location)
    active = []
    for g in groups:
        locations = g.get('locations', [])
        has_active = any(
            loc.get('available', False) and loc.get('enabled', True)
            for loc in locations
        )
        if has_active:
            active.append(g['name'])
    
    return sorted(active)


def scrape_group(group_name: str) -> bool:
    """Scrape a single group using scrape.py."""
    logger.info(f"🔄 Scraping group: {group_name}")
    
    scrape_script = HOME_PATH / "bin" / "scrape.py"
    
    try:
        result = subprocess.run(
            [sys.executable, str(scrape_script), "-G", group_name, "-V"],
            cwd=str(HOME_PATH / "bin"),
            capture_output=True,
            text=True,
            timeout=600  # 10 minute timeout per group
        )
        
        if result.returncode == 0:
            logger.info(f"✅ Scrape completed for {group_name}")
            return True
        else:
            logger.warning(f"⚠️ Scrape returned non-zero for {group_name}: {result.returncode}")
            if result.stderr:
                logger.debug(f"STDERR: {result.stderr[:500]}")
            return True  # Continue anyway
            
    except subprocess.TimeoutExpired:
        logger.error(f"❌ Timeout scraping {group_name}")
        return False
    except Exception as e:
        logger.error(f"❌ Error scraping {group_name}: {e}")
        return False


def parse_group(group_name: str) -> bool:
    """Parse scraped data for a single group."""
    logger.info(f"📝 Parsing group: {group_name}")
    
    parse_script = HOME_PATH / "bin" / "parse.py"
    
    try:
        result = subprocess.run(
            [sys.executable, str(parse_script), "-G", group_name],
            cwd=str(HOME_PATH / "bin"),
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout per group
        )
        
        if result.returncode == 0:
            logger.info(f"✅ Parse completed for {group_name}")
            return True
        else:
            logger.warning(f"⚠️ Parse returned non-zero for {group_name}")
            return True  # Continue anyway
            
    except subprocess.TimeoutExpired:
        logger.error(f"❌ Timeout parsing {group_name}")
        return False
    except Exception as e:
        logger.error(f"❌ Error parsing {group_name}: {e}")
        return False


def run_full_scrape(reset: bool = False):
    """Run full scrape of all active groups with checkpoint support."""
    print(BANNER)
    
    # Load or reset checkpoint
    if reset:
        checkpoint = {
            "started_at": datetime.now().isoformat(),
            "completed_groups": [],
            "failed_groups": [],
            "current_group": None,
            "last_updated": None
        }
        logger.info("🔄 Starting fresh scrape (checkpoint reset)")
    else:
        checkpoint = load_checkpoint()
        if checkpoint.get("completed_groups"):
            logger.info(f"📂 Resuming from checkpoint - {len(checkpoint['completed_groups'])} groups already completed")
        else:
            checkpoint["started_at"] = datetime.now().isoformat()
            logger.info("🚀 Starting new scrape session")
    
    # Get active groups
    all_groups = get_active_groups()
    if not all_groups:
        logger.error("No active groups found!")
        return
    
    logger.info(f"📊 Total active groups: {len(all_groups)}")
    
    # Filter out already completed groups
    completed = set(checkpoint.get("completed_groups", []))
    remaining = [g for g in all_groups if g not in completed]
    
    logger.info(f"📋 Groups to process: {len(remaining)}")
    
    if not remaining:
        logger.info("✅ All groups already completed!")
        return
    
    # Process each group
    start_time = time.time()
    
    for i, group_name in enumerate(remaining):
        group_num = len(completed) + i + 1
        total = len(all_groups)
        
        logger.info(f"\n{'='*60}")
        logger.info(f"📌 Processing [{group_num}/{total}]: {group_name}")
        logger.info(f"{'='*60}")
        
        checkpoint["current_group"] = group_name
        save_checkpoint(checkpoint)
        update_progress(total, group_num - 1, group_name, "scraping")
        
        # Scrape
        scrape_success = scrape_group(group_name)
        
        # Parse (even if scrape had issues - might have cached data)
        update_progress(total, group_num - 1, group_name, "parsing")
        parse_success = parse_group(group_name)
        
        # Update checkpoint
        if scrape_success or parse_success:
            checkpoint["completed_groups"].append(group_name)
        else:
            checkpoint["failed_groups"].append(group_name)
        
        checkpoint["current_group"] = None
        save_checkpoint(checkpoint)
        update_progress(total, len(checkpoint["completed_groups"]), None, "idle")
        
        # Progress log
        elapsed = time.time() - start_time
        avg_time = elapsed / (i + 1)
        remaining_count = len(remaining) - (i + 1)
        eta_seconds = avg_time * remaining_count
        eta_hours = eta_seconds / 3600
        
        logger.info(f"⏱️ Progress: {group_num}/{total} ({(group_num/total)*100:.1f}%)")
        logger.info(f"⏳ ETA: ~{eta_hours:.1f} hours ({remaining_count} groups remaining)")
        
        # Small delay between groups to be nice to Tor
        time.sleep(2)
    
    # Final summary
    elapsed_total = time.time() - start_time
    logger.info(f"\n{'='*60}")
    logger.info(f"🎉 SCRAPE COMPLETED!")
    logger.info(f"{'='*60}")
    logger.info(f"✅ Completed: {len(checkpoint['completed_groups'])} groups")
    logger.info(f"❌ Failed: {len(checkpoint['failed_groups'])} groups")
    logger.info(f"⏱️ Total time: {elapsed_total/3600:.2f} hours")
    
    if checkpoint['failed_groups']:
        logger.info(f"Failed groups: {', '.join(checkpoint['failed_groups'])}")
    
    # Mark as fully completed
    checkpoint["status"] = "completed"
    checkpoint["completed_at"] = datetime.now().isoformat()
    save_checkpoint(checkpoint)
    update_progress(len(all_groups), len(checkpoint["completed_groups"]), None, "completed")


def show_status():
    """Show current scrape status."""
    print(BANNER)
    
    checkpoint = load_checkpoint()
    all_groups = get_active_groups()
    
    print(f"📊 Total active groups: {len(all_groups)}")
    print(f"✅ Completed: {len(checkpoint.get('completed_groups', []))}")
    print(f"❌ Failed: {len(checkpoint.get('failed_groups', []))}")
    print(f"📌 Current: {checkpoint.get('current_group', 'None')}")
    print(f"🕐 Last updated: {checkpoint.get('last_updated', 'Never')}")
    
    if checkpoint.get('started_at'):
        print(f"🚀 Started: {checkpoint['started_at']}")
    
    remaining = len(all_groups) - len(checkpoint.get('completed_groups', []))
    print(f"📋 Remaining: {remaining} groups")
    
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            progress = json.load(f)
        print(f"\n📈 Progress: {progress.get('percentage', 0)}%")
        print(f"📍 Status: {progress.get('status', 'unknown')}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Dragons - Full Scraper with Checkpoint Support",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument("--reset", action="store_true", 
                       help="Reset checkpoint and start fresh")
    parser.add_argument("--status", action="store_true",
                       help="Show current scrape status")
    parser.add_argument("--resume", action="store_true",
                       help="Resume from last checkpoint (default)")
    
    args = parser.parse_args()
    
    if args.status:
        show_status()
    else:
        run_full_scrape(reset=args.reset)


if __name__ == "__main__":
    main()

