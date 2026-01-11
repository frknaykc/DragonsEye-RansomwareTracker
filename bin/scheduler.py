#!/usr/bin/env python3
"""
Dragons-RansomwareMonitoring - Automated Data Scheduler
Runs scrape and parse operations on a configurable schedule.
"""

import os
import sys
import time
import json
import subprocess
import logging
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ====== Configuration ======
home = os.getenv("DRAGONS_HOME", os.getenv("RANSOMWARELIVE_HOME", os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SCRAPE_INTERVAL_HOURS = int(os.getenv("SCRAPE_INTERVAL_HOURS", "6"))  # Default: every 6 hours
PARSE_AFTER_SCRAPE = True
LOG_FILE = os.path.join(home, "logs", "scheduler.log")
STATUS_FILE = os.path.join(home, "tmp", "scheduler_status.json")

# Ensure directories exist
os.makedirs(os.path.join(home, "logs"), exist_ok=True)
os.makedirs(os.path.join(home, "tmp"), exist_ok=True)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

BANNER = """
╔══════════════════════════════════════════════════════════════╗
║     🐉 DRAGONS - Ransomware Monitoring Scheduler 🐉          ║
║                  Automated Data Updates                       ║
╚══════════════════════════════════════════════════════════════╝
"""


def update_status(status: str, last_scrape: datetime = None, last_parse: datetime = None, error: str = None):
    """Update scheduler status file for API consumption."""
    try:
        current_status = {}
        if os.path.exists(STATUS_FILE):
            with open(STATUS_FILE, 'r') as f:
                current_status = json.load(f)
        
        current_status["status"] = status
        current_status["updated_at"] = datetime.now().isoformat()
        
        if last_scrape:
            current_status["last_scrape"] = last_scrape.isoformat()
        if last_parse:
            current_status["last_parse"] = last_parse.isoformat()
        if error:
            current_status["last_error"] = error
            current_status["last_error_time"] = datetime.now().isoformat()
        
        with open(STATUS_FILE, 'w') as f:
            json.dump(current_status, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to update status file: {e}")


def run_scrape():
    """Run the scraper to fetch new data from ransomware sites."""
    logger.info("🔄 Starting scrape operation...")
    update_status("scraping")
    
    scrape_script = os.path.join(home, "bin", "scrape.py")
    
    try:
        result = subprocess.run(
            [sys.executable, scrape_script],
            cwd=os.path.join(home, "bin"),
            capture_output=True,
            text=True,
            timeout=3600  # 1 hour timeout
        )
        
        if result.returncode == 0:
            logger.info("✅ Scrape completed successfully")
            update_status("idle", last_scrape=datetime.now())
            return True
        else:
            logger.error(f"❌ Scrape failed with return code {result.returncode}")
            logger.error(f"STDERR: {result.stderr[:1000] if result.stderr else 'No error output'}")
            update_status("error", error=f"Scrape failed: {result.stderr[:500] if result.stderr else 'Unknown error'}")
            return False
            
    except subprocess.TimeoutExpired:
        logger.error("❌ Scrape timed out after 1 hour")
        update_status("error", error="Scrape timed out")
        return False
    except Exception as e:
        logger.error(f"❌ Scrape failed with exception: {e}")
        update_status("error", error=str(e))
        return False


def run_parse():
    """Run the parser to process scraped data."""
    logger.info("🔄 Starting parse operation...")
    update_status("parsing")
    
    parse_script = os.path.join(home, "bin", "parse.py")
    
    try:
        result = subprocess.run(
            [sys.executable, parse_script],
            cwd=os.path.join(home, "bin"),
            capture_output=True,
            text=True,
            timeout=1800  # 30 min timeout
        )
        
        if result.returncode == 0:
            logger.info("✅ Parse completed successfully")
            update_status("idle", last_parse=datetime.now())
            return True
        else:
            logger.error(f"❌ Parse failed with return code {result.returncode}")
            logger.error(f"STDERR: {result.stderr[:1000] if result.stderr else 'No error output'}")
            update_status("error", error=f"Parse failed: {result.stderr[:500] if result.stderr else 'Unknown error'}")
            return False
            
    except subprocess.TimeoutExpired:
        logger.error("❌ Parse timed out after 30 minutes")
        update_status("error", error="Parse timed out")
        return False
    except Exception as e:
        logger.error(f"❌ Parse failed with exception: {e}")
        update_status("error", error=str(e))
        return False


def run_update_cycle():
    """Run a full update cycle: scrape + parse."""
    logger.info("=" * 60)
    logger.info(f"🐉 Starting update cycle at {datetime.now().isoformat()}")
    logger.info("=" * 60)
    
    # Run scrape
    scrape_success = run_scrape()
    
    # Run parse if scrape succeeded or if we want to parse anyway
    if scrape_success and PARSE_AFTER_SCRAPE:
        parse_success = run_parse()
    else:
        parse_success = False
        if not scrape_success:
            logger.warning("Skipping parse due to scrape failure")
    
    logger.info(f"📊 Update cycle completed. Scrape: {'✅' if scrape_success else '❌'}, Parse: {'✅' if parse_success else '❌'}")
    return scrape_success and parse_success


def get_last_scrape_time() -> datetime:
    """Get the last successful scrape time from status file."""
    try:
        if os.path.exists(STATUS_FILE):
            with open(STATUS_FILE, 'r') as f:
                status = json.load(f)
                if "last_scrape" in status:
                    return datetime.fromisoformat(status["last_scrape"])
    except Exception:
        pass
    
    # Check victims.json modification time as fallback
    victims_file = os.path.join(home, "db", "victims.json")
    if os.path.exists(victims_file):
        return datetime.fromtimestamp(os.path.getmtime(victims_file))
    
    return datetime.min


def should_run_update() -> bool:
    """Check if enough time has passed since last update."""
    last_scrape = get_last_scrape_time()
    next_run = last_scrape + timedelta(hours=SCRAPE_INTERVAL_HOURS)
    
    if datetime.now() >= next_run:
        return True
    
    logger.info(f"⏰ Next update scheduled for {next_run.isoformat()}")
    return False


def run_once():
    """Run a single update cycle."""
    print(BANNER)
    logger.info("Running single update cycle...")
    success = run_update_cycle()
    return 0 if success else 1


def run_daemon():
    """Run as a daemon, checking for updates on schedule."""
    print(BANNER)
    logger.info(f"🐉 Dragons Scheduler started in daemon mode")
    logger.info(f"📅 Update interval: every {SCRAPE_INTERVAL_HOURS} hours")
    
    update_status("idle")
    
    while True:
        try:
            if should_run_update():
                run_update_cycle()
            
            # Sleep for 5 minutes before checking again
            time.sleep(300)
            
        except KeyboardInterrupt:
            logger.info("Scheduler stopped by user")
            update_status("stopped")
            break
        except Exception as e:
            logger.error(f"Unexpected error in scheduler: {e}")
            update_status("error", error=str(e))
            time.sleep(60)  # Wait a minute before retrying


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Dragons - Ransomware Monitoring Scheduler",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scheduler.py --once          # Run single update cycle
  python scheduler.py --daemon        # Run as background daemon
  python scheduler.py --scrape        # Run only scrape
  python scheduler.py --parse         # Run only parse
  python scheduler.py --status        # Show scheduler status
        """
    )
    
    parser.add_argument("--once", action="store_true", help="Run single update cycle and exit")
    parser.add_argument("--daemon", action="store_true", help="Run as daemon with scheduled updates")
    parser.add_argument("--scrape", action="store_true", help="Run only the scraper")
    parser.add_argument("--parse", action="store_true", help="Run only the parser")
    parser.add_argument("--status", action="store_true", help="Show current scheduler status")
    parser.add_argument("--interval", type=int, help="Override update interval (hours)")
    
    args = parser.parse_args()
    
    if args.interval:
        global SCRAPE_INTERVAL_HOURS
        SCRAPE_INTERVAL_HOURS = args.interval
    
    if args.status:
        print(BANNER)
        if os.path.exists(STATUS_FILE):
            with open(STATUS_FILE, 'r') as f:
                status = json.load(f)
                print("📊 Scheduler Status:")
                print(json.dumps(status, indent=2))
        else:
            print("No status file found. Scheduler has not run yet.")
        
        # Show data file ages
        victims_file = os.path.join(home, "db", "victims.json")
        groups_file = os.path.join(home, "tmp", "groups.json")
        
        print("\n📁 Data File Status:")
        if os.path.exists(victims_file):
            age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(victims_file))
            print(f"  victims.json: {age.days}d {age.seconds//3600}h old")
        if os.path.exists(groups_file):
            age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(groups_file))
            print(f"  groups.json:  {age.days}d {age.seconds//3600}h old")
        
        return 0
    
    if args.scrape:
        print(BANNER)
        return 0 if run_scrape() else 1
    
    if args.parse:
        print(BANNER)
        return 0 if run_parse() else 1
    
    if args.daemon:
        return run_daemon()
    
    # Default: run once
    return run_once()


if __name__ == "__main__":
    sys.exit(main())

