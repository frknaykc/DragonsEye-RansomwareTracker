#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🐉 Dragons-RansomwareMonitoring API Server
FastAPI-based REST API for ransomware threat intelligence data
"""

import json
import os
import subprocess
import sys
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any
from collections import Counter
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, HTTPException, Path as PathParam, BackgroundTasks, UploadFile, File, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import shutil
import secrets
import hashlib
from pydantic import BaseModel
import uvicorn

# ============================================================================
# Configuration
# ============================================================================

BASE_DIR = Path(__file__).parent.parent
DB_DIR = BASE_DIR / "db"
TMP_DIR = BASE_DIR / "tmp"
BIN_DIR = BASE_DIR / "bin"
LOGS_DIR = BASE_DIR / "logs"
UPLOADS_DIR = BASE_DIR / "uploads"
IMAGES_DIR = BASE_DIR / "images"
GROUP_LOGOS_DIR = IMAGES_DIR / "groups"

VICTIMS_FILE = DB_DIR / "victims.json"
GROUPS_FILE = DB_DIR / "groups.json"
SCHEDULER_STATUS_FILE = TMP_DIR / "scheduler_status.json"

# Create directories if they don't exist
TMP_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)

# ============================================================================
# Security Configuration
# ============================================================================

# Admin credentials - Use environment variables in production!
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD_HASH = os.environ.get("ADMIN_PASSWORD_HASH", 
    hashlib.sha256("dragons2024!".encode()).hexdigest()  # Default for development only!
)

# Rate limiting (simple in-memory implementation)
_request_counts: Dict[str, List[float]] = {}
RATE_LIMIT_REQUESTS = 100  # requests per window
RATE_LIMIT_WINDOW = 60  # seconds

# Security setup
security = HTTPBasic()

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)) -> bool:
    """Verify admin credentials using constant-time comparison"""
    username_correct = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    password_hash = hashlib.sha256(credentials.password.encode()).hexdigest()
    password_correct = secrets.compare_digest(password_hash, ADMIN_PASSWORD_HASH)
    
    if not (username_correct and password_correct):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return True

def check_rate_limit(request: Request) -> bool:
    """Simple rate limiting by IP"""
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    if client_ip not in _request_counts:
        _request_counts[client_ip] = []
    
    # Remove old requests outside the window
    _request_counts[client_ip] = [
        t for t in _request_counts[client_ip] 
        if current_time - t < RATE_LIMIT_WINDOW
    ]
    
    if len(_request_counts[client_ip]) >= RATE_LIMIT_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please slow down."
        )
    
    _request_counts[client_ip].append(current_time)
    return True


def get_group_logo(group_name: str) -> Optional[str]:
    """Find logo file for a group"""
    if not GROUP_LOGOS_DIR.exists():
        return None
    
    # Normalize group name for matching
    normalized = group_name.lower().replace(' ', '').replace('-', '').replace('_', '')
    
    # Search for matching logo file
    for logo_file in GROUP_LOGOS_DIR.glob("*.png"):
        file_name = logo_file.stem.lower()  # e.g., "akira-20b9c29ad935c2a3fa04542a1c3396b0"
        # Extract group name from filename (before the hash)
        parts = file_name.rsplit('-', 1)
        if len(parts) >= 1:
            logo_group = parts[0].replace(' ', '').replace('-', '').replace('_', '')
            if logo_group == normalized or normalized.startswith(logo_group) or logo_group.startswith(normalized):
                return f"/api/v1/group-logo/{logo_file.name}"
    
    return None

# Track active background tasks
_update_in_progress = False
_scheduler_running = False
_scheduler_thread = None

# Scheduler Configuration
UPDATE_INTERVAL_MINUTES = 30  # Update every 30 minutes
RUN_ON_STARTUP = False  # Don't run immediately on startup - let it settle first
SCRAPE_TIMEOUT_SECONDS = 1800  # 30 minutes max for scrape
PARSE_TIMEOUT_SECONDS = 600   # 10 minutes max for parse
MAX_CONCURRENT_GROUPS = 20    # Limit concurrent group scraping


def auto_update_scheduler():
    """Background scheduler that triggers updates every 30 minutes."""
    global _update_in_progress, _scheduler_running
    print(f"🕐 Auto-update scheduler started (interval: {UPDATE_INTERVAL_MINUTES} minute(s))")
    print(f"   Scrape timeout: {SCRAPE_TIMEOUT_SECONDS}s, Parse timeout: {PARSE_TIMEOUT_SECONDS}s")
    
    # Initial delay to let API fully start
    time.sleep(10)
    
    while _scheduler_running:
        # Check if update is already in progress
        if _update_in_progress:
            print("⏳ Scheduled update skipped - update already in progress")
        else:
            # Trigger update
            print(f"🔄 Scheduled update starting at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            try:
                run_update_background()
            except Exception as e:
                print(f"❌ Scheduled update failed: {e}")
        
        # Wait for the interval
        for _ in range(UPDATE_INTERVAL_MINUTES * 60):  # Check every second
            if not _scheduler_running:
                return
            time.sleep(1)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to start/stop scheduler."""
    global _scheduler_running, _scheduler_thread
    
    # Startup
    _scheduler_running = True
    _scheduler_thread = threading.Thread(target=auto_update_scheduler, daemon=True)
    _scheduler_thread.start()
    print("✅ Dragons Eye API started with auto-update scheduler")
    
    yield
    
    # Shutdown
    _scheduler_running = False
    if _scheduler_thread:
        _scheduler_thread.join(timeout=5)
    print("👋 Dragons Eye API shutting down")

# ============================================================================
# Pydantic Models
# ============================================================================

class VictimBase(BaseModel):
    post_title: str
    group_name: str
    discovered: Optional[str] = None
    description: Optional[str] = ""
    website: Optional[str] = ""
    published: Optional[str] = None
    post_url: Optional[str] = ""
    country: Optional[str] = ""
    activity: Optional[str] = ""
    duplicates: Optional[List[Dict]] = []
    extrainfos: Optional[List[Dict]] = []

class GroupBase(BaseModel):
    name: str
    captcha: Optional[bool] = False
    parser: Optional[bool] = True
    javascript_render: Optional[bool] = False
    meta: Optional[str] = None
    description: Optional[str] = None
    locations: Optional[List[Dict]] = []
    profile: Optional[List] = []

class StatsResponse(BaseModel):
    total_victims: int
    total_groups: int
    active_groups: int
    countries_affected: int
    today_new: int
    top_group: str
    top_group_count: int

class CountryStats(BaseModel):
    country: str
    count: int
    percentage: float

class SectorStats(BaseModel):
    sector: str
    count: int
    percentage: float

class GroupStats(BaseModel):
    group: str
    count: int
    percentage: float

# ============================================================================
# Data Loading Functions
# ============================================================================

def load_victims() -> List[Dict]:
    """Load victims data from JSON file"""
    if not VICTIMS_FILE.exists():
        return []
    with open(VICTIMS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_groups() -> List[Dict]:
    """Load groups data from JSON file"""
    if not GROUPS_FILE.exists():
        return []
    with open(GROUPS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

# Cache for performance
_victims_cache = None
_victims_cache_time = None
_groups_cache = None
_groups_cache_time = None
CACHE_TTL = 60  # seconds

def get_victims() -> List[Dict]:
    global _victims_cache, _victims_cache_time
    now = datetime.now()
    if _victims_cache is None or _victims_cache_time is None or \
       (now - _victims_cache_time).seconds > CACHE_TTL:
        _victims_cache = load_victims()
        _victims_cache_time = now
    return _victims_cache

def get_groups() -> List[Dict]:
    global _groups_cache, _groups_cache_time
    now = datetime.now()
    if _groups_cache is None or _groups_cache_time is None or \
       (now - _groups_cache_time).seconds > CACHE_TTL:
        _groups_cache = load_groups()
        _groups_cache_time = now
    return _groups_cache

# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(
    title="🐉 Dragons Eye - Ransomware Tracker API",
    description="REST API for ransomware threat intelligence data",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware - Configure for production!
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
# For production, set ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Security Headers Middleware
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        # In production with HTTPS, add:
        # response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ============================================================================
# Health Check
# ============================================================================

@app.get("/", tags=["Health"])
async def root():
    """API Health Check"""
    return {
        "status": "online",
        "service": "Dragons-RansomwareMonitoring API",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check"""
    victims = get_victims()
    groups = get_groups()
    return {
        "status": "healthy",
        "victims_count": len(victims),
        "groups_count": len(groups),
        "victims_file": str(VICTIMS_FILE),
        "groups_file": str(GROUPS_FILE),
        "timestamp": datetime.now().isoformat()
    }

# ============================================================================
# Authentication
# ============================================================================

@app.post("/api/v1/auth/login", tags=["Auth"])
async def admin_login(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials and return a session token"""
    verify_admin(credentials)  # Will raise 401 if invalid
    
    # Generate a simple session token (in production, use JWT or similar)
    session_token = secrets.token_urlsafe(32)
    
    return {
        "success": True,
        "message": "Authentication successful",
        "token": session_token,
        "expires_in": 3600  # 1 hour
    }

@app.get("/api/v1/auth/verify", tags=["Auth"])
async def verify_auth(authenticated: bool = Depends(verify_admin)):
    """Verify current authentication status"""
    return {"authenticated": True, "message": "Valid credentials"}

# ============================================================================
# Data Status & Update Endpoints
# ============================================================================

def get_file_age_info(file_path: Path) -> dict:
    """Get file modification info"""
    if not file_path.exists():
        return {"exists": False, "age": None, "modified": None}
    
    mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
    age = datetime.now() - mtime
    
    return {
        "exists": True,
        "modified": mtime.isoformat(),
        "age_hours": round(age.total_seconds() / 3600, 1),
        "age_human": f"{age.days}d {age.seconds // 3600}h" if age.days > 0 else f"{age.seconds // 3600}h {(age.seconds % 3600) // 60}m"
    }

def get_scheduler_status() -> dict:
    """Get scheduler status from status file"""
    if not SCHEDULER_STATUS_FILE.exists():
        return {"status": "never_run", "message": "Scheduler has never run"}
    
    try:
        with open(SCHEDULER_STATUS_FILE, 'r') as f:
            return json.load(f)
    except:
        return {"status": "unknown", "message": "Could not read scheduler status"}

@app.get("/api/v1/status", tags=["Status"])
async def get_data_status():
    """Get data freshness status and scheduler info"""
    global _update_in_progress
    
    victims_info = get_file_age_info(VICTIMS_FILE)
    groups_info = get_file_age_info(GROUPS_FILE)
    scheduler_status = get_scheduler_status()
    
    # Determine data freshness
    if victims_info["exists"]:
        if victims_info["age_hours"] < 6:
            freshness = "fresh"
            freshness_message = "Data is up to date"
        elif victims_info["age_hours"] < 24:
            freshness = "stale"
            freshness_message = "Data needs update"
        else:
            freshness = "outdated"
            freshness_message = "Data is outdated"
    else:
        freshness = "missing"
        freshness_message = "No victim data found"
    
    return {
        "data_freshness": freshness,
        "message": freshness_message,
        "update_in_progress": _update_in_progress,
        "victims": victims_info,
        "groups": groups_info,
        "scheduler": scheduler_status,
        "timestamp": datetime.now().isoformat()
    }

def run_update_background():
    """Background task to run data update"""
    global _update_in_progress
    _update_in_progress = True
    
    # Log file for verbose output
    update_log_file = LOGS_DIR / f"update_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    # Convenience symlink: logs/update_latest.log always points to most recent run
    latest_symlink = LOGS_DIR / "update_latest.log"
    try:
        if latest_symlink.exists() or latest_symlink.is_symlink():
            latest_symlink.unlink()
        latest_symlink.symlink_to(update_log_file.name)
    except Exception:
        # Non-fatal: continue even if symlink fails (e.g., permissions on Windows)
        pass
    
    try:
        # Update scheduler status file
        status_data = {
            "status": "updating",
            "started_at": datetime.now().isoformat(),
            "message": "Update in progress...",
            "log_file": str(update_log_file)
        }
        with open(SCHEDULER_STATUS_FILE, 'w') as f:
            json.dump(status_data, f, indent=2)
        
        with open(update_log_file, 'w') as log_file:
            log_file.write(f"=== Update started at {datetime.now().isoformat()} ===\n")
            log_file.write(f"[STATUS] Preparing scrape & parse pipeline\n")
            log_file.write(f"[LOGFILE] {update_log_file}\n\n")
            log_file.flush()
            
            # Run scrape with verbose flag
            scrape_script = BIN_DIR / "scrape.py"
            log_file.write(f"[SCRAPE] Starting scrape.py -V ...\n")
            log_file.flush()
            
            try:
                result = subprocess.run(
                    [sys.executable, str(scrape_script), "-V"],
                    cwd=str(BIN_DIR),
                    stdout=log_file,
                    stderr=subprocess.STDOUT,
                    text=True,
                    timeout=SCRAPE_TIMEOUT_SECONDS  # 30 minutes max
                )
                scrape_success = result.returncode == 0
                log_file.write(f"\n[SCRAPE] Finished with return code: {result.returncode}\n")
                if not scrape_success:
                    log_file.write(f"[SCRAPE] FAILED - but will still try parse (partial data may exist)\n\n")
                else:
                    log_file.write(f"[SCRAPE] OK - proceeding to parse\n\n")
            except subprocess.TimeoutExpired:
                log_file.write(f"\n[SCRAPE] TIMEOUT after {SCRAPE_TIMEOUT_SECONDS}s - proceeding to parse anyway\n\n")
                scrape_success = False  # Timed out but continue to parse
            log_file.flush()
        
            # Always run parse (even if scrape timed out, we may have partial data)
            parse_script = BIN_DIR / "parse.py"
            log_file.write(f"[PARSE] Starting parse.py ...\n")
            log_file.flush()
            
            try:
                result = subprocess.run(
                    [sys.executable, str(parse_script)],
                    cwd=str(BIN_DIR),
                    stdout=log_file,
                    stderr=subprocess.STDOUT,
                    text=True,
                    timeout=PARSE_TIMEOUT_SECONDS  # 10 minutes max
                )
                parse_success = result.returncode == 0
                log_file.write(f"\n[PARSE] Finished with return code: {result.returncode}\n")
                if parse_success:
                    log_file.write(f"[PARSE] OK - victims/groups should be refreshed\n")
                else:
                    log_file.write(f"[PARSE] FAILED - data not updated\n")
            except subprocess.TimeoutExpired:
                log_file.write(f"\n[PARSE] TIMEOUT after {PARSE_TIMEOUT_SECONDS}s\n")
                parse_success = False
            
            log_file.write(f"\n=== Update finished at {datetime.now().isoformat()} ===\n")
        
        # Update status file
        status_data = {
            "status": "idle" if (scrape_success and parse_success) else "error",
            "last_update": datetime.now().isoformat(),
            "last_scrape": datetime.now().isoformat() if scrape_success else None,
            "last_parse": datetime.now().isoformat() if parse_success else None,
            "message": "Update completed" if (scrape_success and parse_success) else "Update failed",
            "log_file": str(update_log_file)
        }
        with open(SCHEDULER_STATUS_FILE, 'w') as f:
            json.dump(status_data, f, indent=2)
        
        # Clear cache to load fresh data
        global _victims_cache, _groups_cache
        _victims_cache = None
        _groups_cache = None
        
    except Exception as e:
        status_data = {
            "status": "error",
            "last_error": str(e),
            "last_error_time": datetime.now().isoformat(),
            "log_file": str(update_log_file) if update_log_file else None
        }
        with open(SCHEDULER_STATUS_FILE, 'w') as f:
            json.dump(status_data, f, indent=2)
    
    finally:
        _update_in_progress = False

@app.post("/api/v1/update/trigger", tags=["Status"])
async def trigger_update(background_tasks: BackgroundTasks):
    """Trigger a data update (scrape + parse) in the background"""
    global _update_in_progress
    
    if _update_in_progress:
        return {
            "success": False,
            "message": "Update already in progress",
            "status": "running"
        }
    
    background_tasks.add_task(run_update_background)
    
    return {
        "success": True,
        "message": "Update started in background",
        "status": "started",
        "note": "Check /api/v1/status for progress"
    }

@app.get("/api/v1/update/logs", tags=["Status"])
async def get_update_logs(lines: int = Query(100, ge=1, le=1000)):
    """Get the latest update log file content (tail)"""
    scheduler_status = get_scheduler_status()
    log_file = scheduler_status.get("log_file")
    
    if not log_file or not Path(log_file).exists():
        # Try to find the latest log file
        log_files = sorted(LOGS_DIR.glob("update_*.log"), reverse=True)
        if log_files:
            log_file = str(log_files[0])
        else:
            return {"error": "No update log files found", "logs": ""}
    
    try:
        with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
            all_lines = f.readlines()
            tail_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
            return {
                "log_file": log_file,
                "total_lines": len(all_lines),
                "showing_lines": len(tail_lines),
                "logs": "".join(tail_lines)
            }
    except Exception as e:
        return {"error": str(e), "logs": ""}

@app.post("/api/v1/cache/clear", tags=["Status"])
async def clear_cache():
    """Clear the data cache to force reload from files"""
    global _victims_cache, _groups_cache, _victims_cache_time, _groups_cache_time
    
    _victims_cache = None
    _victims_cache_time = None
    _groups_cache = None
    _groups_cache_time = None
    
    return {
        "success": True,
        "message": "Cache cleared. Next request will reload data from files."
    }

# ============================================================================
# Statistics Endpoints
# ============================================================================

@app.get("/api/v1/stats/summary", response_model=StatsResponse, tags=["Statistics"])
async def get_stats_summary():
    """Get summary statistics for dashboard"""
    victims = get_victims()
    groups = get_groups()
    
    # Count today's new victims
    today = datetime.now().date()
    today_new = 0
    for v in victims:
        try:
            discovered = v.get('discovered', '')
            if discovered:
                disc_date = datetime.strptime(discovered[:10], '%Y-%m-%d').date()
                if disc_date == today:
                    today_new += 1
        except:
            pass
    
    # Count active groups (groups with at least one enabled location)
    active_groups = 0
    for g in groups:
        locations = g.get('locations', [])
        if any(loc.get('available', False) for loc in locations):
            active_groups += 1
    
    # Count unique countries
    countries = set(v.get('country', '') for v in victims if v.get('country'))
    
    # Find top group
    group_counts = Counter(v.get('group_name', '') for v in victims)
    top_group = group_counts.most_common(1)[0] if group_counts else ('Unknown', 0)
    
    return StatsResponse(
        total_victims=len(victims),
        total_groups=len(groups),
        active_groups=active_groups,
        countries_affected=len(countries),
        today_new=today_new,
        top_group=top_group[0],
        top_group_count=top_group[1]
    )

@app.get("/api/v1/stats/countries", tags=["Statistics"])
async def get_country_stats(limit: int = Query(20, ge=1, le=100)):
    """Get victim statistics by country"""
    victims = get_victims()
    
    country_counts = Counter(
        v.get('country', 'Unknown') or 'Unknown' 
        for v in victims
    )
    
    total = sum(country_counts.values())
    
    stats = [
        {
            "country": country,
            "count": count,
            "percentage": round((count / total) * 100, 2) if total > 0 else 0
        }
        for country, count in country_counts.most_common(limit)
    ]
    
    return {"total": total, "data": stats}

@app.get("/api/v1/stats/sectors", tags=["Statistics"])
async def get_sector_stats(limit: int = Query(15, ge=1, le=50)):
    """Get victim statistics by sector/industry"""
    victims = get_victims()
    
    sector_counts = Counter(
        v.get('activity', 'Unknown') or 'Unknown'
        for v in victims
    )
    
    total = sum(sector_counts.values())
    
    stats = [
        {
            "sector": sector,
            "count": count,
            "percentage": round((count / total) * 100, 2) if total > 0 else 0
        }
        for sector, count in sector_counts.most_common(limit)
    ]
    
    return {"total": total, "data": stats}

@app.get("/api/v1/stats/groups", tags=["Statistics"])
async def get_group_stats(limit: int = Query(20, ge=1, le=100)):
    """Get victim statistics by ransomware group"""
    victims = get_victims()
    
    group_counts = Counter(
        v.get('group_name', 'Unknown') or 'Unknown'
        for v in victims
    )
    
    total = sum(group_counts.values())
    
    stats = [
        {
            "group": group,
            "count": count,
            "percentage": round((count / total) * 100, 2) if total > 0 else 0
        }
        for group, count in group_counts.most_common(limit)
    ]
    
    return {"total": total, "data": stats}

@app.get("/api/v1/stats/trend", tags=["Statistics"])
async def get_trend_stats(days: int = Query(30, ge=7, le=365)):
    """Get daily victim trend for the specified number of days"""
    victims = get_victims()
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)
    
    # Initialize daily counts
    daily_counts = {}
    current = start_date
    while current <= end_date:
        daily_counts[current.isoformat()] = 0
        current += timedelta(days=1)
    
    # Count victims per day
    for v in victims:
        try:
            discovered = v.get('discovered', '')
            if discovered:
                disc_date = datetime.strptime(discovered[:10], '%Y-%m-%d').date()
                if start_date <= disc_date <= end_date:
                    daily_counts[disc_date.isoformat()] += 1
        except:
            pass
    
    trend_data = [
        {"date": date, "count": count}
        for date, count in sorted(daily_counts.items())
    ]
    
    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_days": days,
        "data": trend_data
    }

# ============================================================================
# Victims Endpoints
# ============================================================================

@app.get("/api/v1/victims", tags=["Victims"])
async def list_victims(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    group: Optional[str] = Query(None, description="Filter by group name"),
    country: Optional[str] = Query(None, description="Filter by country code"),
    sector: Optional[str] = Query(None, description="Filter by sector/activity"),
    search: Optional[str] = Query(None, description="Search in victim name"),
    sort: str = Query("desc", regex="^(asc|desc)$", description="Sort by discovered date")
):
    """List victims with pagination and filters"""
    victims = get_victims()
    
    # Apply filters
    filtered = victims
    
    if group:
        filtered = [v for v in filtered if v.get('group_name', '').lower() == group.lower()]
    
    if country:
        filtered = [v for v in filtered if v.get('country', '').upper() == country.upper()]
    
    if sector:
        filtered = [v for v in filtered if sector.lower() in v.get('activity', '').lower()]
    
    if search:
        search_lower = search.lower()
        filtered = [
            v for v in filtered 
            if search_lower in v.get('post_title', '').lower() or
               search_lower in v.get('website', '').lower()
        ]
    
    # Sort by discovered date
    def get_date(v):
        try:
            return datetime.strptime(v.get('discovered', '1970-01-01')[:19], '%Y-%m-%d %H:%M:%S')
        except:
            return datetime(1970, 1, 1)
    
    filtered.sort(key=get_date, reverse=(sort == 'desc'))
    
    # Pagination
    total = len(filtered)
    start = (page - 1) * limit
    end = start + limit
    paginated = filtered[start:end]
    
    # Add index for identification
    for i, v in enumerate(paginated):
        v['_index'] = start + i
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "data": paginated
    }

@app.get("/api/v1/victims/{index}", tags=["Victims"])
async def get_victim(index: int = PathParam(..., ge=0)):
    """Get a specific victim by index"""
    victims = get_victims()
    
    if index >= len(victims):
        raise HTTPException(status_code=404, detail="Victim not found")
    
    victim = victims[index]
    victim['_index'] = index
    return victim

@app.get("/api/v1/victims/search/{query}", tags=["Victims"])
async def search_victims(
    query: str,
    limit: int = Query(50, ge=1, le=200)
):
    """Search victims by name or website"""
    victims = get_victims()
    query_lower = query.lower()
    
    results = [
        v for v in victims
        if query_lower in v.get('post_title', '').lower() or
           query_lower in v.get('website', '').lower() or
           query_lower in v.get('description', '').lower()
    ][:limit]
    
    return {"total": len(results), "data": results}

# ============================================================================
# Groups Endpoints
# ============================================================================

@app.get("/api/v1/groups", tags=["Groups"])
async def list_groups(
    active_only: bool = Query(False, description="Show only active groups"),
    search: Optional[str] = Query(None, description="Search by group name")
):
    """List all ransomware groups"""
    groups = get_groups()
    victims = get_victims()
    
    # Count victims per group
    victim_counts = Counter(v.get('group_name', '') for v in victims)
    
    result = []
    for g in groups:
        name = g.get('name', '')
        
        # Check if active
        locations = g.get('locations', [])
        is_active = any(loc.get('available', False) for loc in locations)
        
        if active_only and not is_active:
            continue
        
        if search and search.lower() not in name.lower():
            continue
        
        # Find logo for this group
        logo_url = get_group_logo(name)
        
        result.append({
            "name": name,
            "victim_count": victim_counts.get(name, 0),
            "is_active": is_active,
            "locations_count": len(locations),
            "meta": g.get('meta'),
            "description": g.get('description'),
            "has_parser": g.get('parser', False),
            "logo_url": logo_url
        })
    
    # Sort by victim count
    result.sort(key=lambda x: x['victim_count'], reverse=True)
    
    return {"total": len(result), "data": result}

@app.get("/api/v1/groups/{name}", tags=["Groups"])
async def get_group(name: str):
    """Get detailed information about a specific group"""
    groups = get_groups()
    victims = get_victims()
    
    # Find group
    group = None
    for g in groups:
        if g.get('name', '').lower() == name.lower():
            group = g
            break
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Get victims for this group
    group_victims = [
        v for v in victims 
        if v.get('group_name', '').lower() == name.lower()
    ]
    
    # Recent victims (last 20)
    group_victims.sort(
        key=lambda x: x.get('discovered', ''),
        reverse=True
    )
    recent_victims = group_victims[:20]
    
    # Country distribution for this group
    country_counts = Counter(
        v.get('country', 'Unknown') or 'Unknown'
        for v in group_victims
    )
    
    # Sector distribution
    sector_counts = Counter(
        v.get('activity', 'Unknown') or 'Unknown'
        for v in group_victims
    )
    
    return {
        **group,
        "victim_count": len(group_victims),
        "recent_victims": recent_victims,
        "country_distribution": dict(country_counts.most_common(10)),
        "sector_distribution": dict(sector_counts.most_common(10))
    }

@app.get("/api/v1/groups/{name}/victims", tags=["Groups"])
async def get_group_victims(
    name: str,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100)
):
    """Get all victims of a specific group"""
    victims = get_victims()
    
    group_victims = [
        v for v in victims
        if v.get('group_name', '').lower() == name.lower()
    ]
    
    # Sort by date
    group_victims.sort(
        key=lambda x: x.get('discovered', ''),
        reverse=True
    )
    
    # Pagination
    total = len(group_victims)
    start = (page - 1) * limit
    end = start + limit
    
    return {
        "group": name,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "data": group_victims[start:end]
    }

# ============================================================================
# Ransom Notes API
# ============================================================================

RANSOM_NOTES_FILE = DB_DIR / "ransom_notes.json"

def get_ransom_notes():
    """Load ransom notes from JSON file"""
    if not RANSOM_NOTES_FILE.exists():
        return []
    with open(RANSOM_NOTES_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_ransom_notes(notes):
    """Save ransom notes to JSON file"""
    with open(RANSOM_NOTES_FILE, 'w', encoding='utf-8') as f:
        json.dump(notes, f, indent=2, ensure_ascii=False)

@app.get("/api/v1/ransom-notes", tags=["Ransom Notes"])
async def list_ransom_notes(group: str = None):
    """Get all ransom notes, optionally filtered by group"""
    notes = get_ransom_notes()
    if group:
        notes = [n for n in notes if n.get('group_name', '').lower() == group.lower()]
    return {"total": len(notes), "data": notes}

@app.get("/api/v1/ransom-notes/{note_id}", tags=["Ransom Notes"])
async def get_ransom_note(note_id: str):
    """Get a specific ransom note by ID"""
    notes = get_ransom_notes()
    for note in notes:
        if note.get('id') == note_id:
            return note
    raise HTTPException(status_code=404, detail="Ransom note not found")

@app.post("/api/v1/ransom-notes", tags=["Ransom Notes"])
async def create_ransom_note(
    group_name: str,
    note_title: str,
    note_content: str,
    filename: str,
    file_extensions: str = ""  # comma-separated
):
    """Create a new ransom note"""
    notes = get_ransom_notes()
    
    # Generate ID
    note_id = f"{group_name.lower()}-{len([n for n in notes if n.get('group_name') == group_name]) + 1}"
    
    new_note = {
        "id": note_id,
        "group_name": group_name.lower(),
        "note_title": note_title,
        "note_content": note_content,
        "filename": filename,
        "file_extensions": [ext.strip() for ext in file_extensions.split(",") if ext.strip()],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    notes.append(new_note)
    save_ransom_notes(notes)
    
    return {"message": "Ransom note created", "data": new_note}

@app.put("/api/v1/ransom-notes/{note_id}", tags=["Ransom Notes"])
async def update_ransom_note(
    note_id: str,
    note_title: str = None,
    note_content: str = None,
    filename: str = None,
    file_extensions: str = None
):
    """Update an existing ransom note"""
    notes = get_ransom_notes()
    
    for i, note in enumerate(notes):
        if note.get('id') == note_id:
            if note_title:
                notes[i]['note_title'] = note_title
            if note_content:
                notes[i]['note_content'] = note_content
            if filename:
                notes[i]['filename'] = filename
            if file_extensions is not None:
                notes[i]['file_extensions'] = [ext.strip() for ext in file_extensions.split(",") if ext.strip()]
            notes[i]['updated_at'] = datetime.now().isoformat()
            
            save_ransom_notes(notes)
            return {"message": "Ransom note updated", "data": notes[i]}
    
    raise HTTPException(status_code=404, detail="Ransom note not found")

@app.delete("/api/v1/ransom-notes/{note_id}", tags=["Ransom Notes"])
async def delete_ransom_note(note_id: str):
    """Delete a ransom note"""
    notes = get_ransom_notes()
    
    for i, note in enumerate(notes):
        if note.get('id') == note_id:
            deleted = notes.pop(i)
            save_ransom_notes(notes)
            return {"message": "Ransom note deleted", "data": deleted}
    
    raise HTTPException(status_code=404, detail="Ransom note not found")

# ============================================================================
# Decryptors API
# ============================================================================

DECRYPTORS_FILE = DB_DIR / "decryptors.json"

def get_decryptors():
    """Load decryptors from JSON file"""
    if not DECRYPTORS_FILE.exists():
        return []
    with open(DECRYPTORS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_decryptors(decryptors):
    """Save decryptors to JSON file"""
    with open(DECRYPTORS_FILE, 'w', encoding='utf-8') as f:
        json.dump(decryptors, f, indent=2, ensure_ascii=False)

@app.get("/api/v1/decryptors", tags=["Decryptors"])
async def list_decryptors(status: str = None, group: str = None):
    """Get all decryptors, optionally filtered by status or group"""
    decryptors = get_decryptors()
    if status:
        decryptors = [d for d in decryptors if d.get('status', '').lower() == status.lower()]
    if group:
        decryptors = [d for d in decryptors if d.get('group_name', '').lower() == group.lower()]
    return {"total": len(decryptors), "data": decryptors}

@app.get("/api/v1/decryptors/{decryptor_id}", tags=["Decryptors"])
async def get_decryptor(decryptor_id: str):
    """Get a specific decryptor by ID"""
    decryptors = get_decryptors()
    for d in decryptors:
        if d.get('id') == decryptor_id:
            return d
    raise HTTPException(status_code=404, detail="Decryptor not found")

@app.post("/api/v1/decryptors", tags=["Decryptors"])
async def create_decryptor(
    group_name: str,
    decryptor_name: str,
    provider: str,
    provider_url: str,
    download_url: str,
    description: str,
    file_extensions: str = "",  # comma-separated
    status: str = "active",
    release_date: str = "",
    notes: str = "",
    how_to_guide_type: str = "none",  # none, url, text, pdf
    how_to_guide_url: str = "",
    how_to_guide_text: str = "",
    detailed_description: str = ""
):
    """Create a new decryptor entry"""
    decryptors = get_decryptors()
    
    # Generate ID
    import uuid
    decryptor_id = str(uuid.uuid4())[:8]
    
    new_decryptor = {
        "id": decryptor_id,
        "group_name": group_name.lower(),
        "decryptor_name": decryptor_name,
        "provider": provider,
        "provider_url": provider_url,
        "download_url": download_url,
        "description": description,
        "detailed_description": detailed_description,
        "file_extensions": [ext.strip() for ext in file_extensions.split(",") if ext.strip()],
        "status": status,
        "release_date": release_date,
        "notes": notes,
        "how_to_guide_type": how_to_guide_type,
        "how_to_guide_url": how_to_guide_url,
        "how_to_guide_text": how_to_guide_text,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    decryptors.append(new_decryptor)
    save_decryptors(decryptors)
    
    return {"message": "Decryptor created", "data": new_decryptor}

@app.put("/api/v1/decryptors/{decryptor_id}", tags=["Decryptors"])
async def update_decryptor(
    decryptor_id: str,
    decryptor_name: str = None,
    provider: str = None,
    provider_url: str = None,
    download_url: str = None,
    description: str = None,
    file_extensions: str = None,
    status: str = None,
    release_date: str = None,
    notes: str = None,
    how_to_guide_type: str = None,
    how_to_guide_url: str = None,
    how_to_guide_text: str = None,
    detailed_description: str = None
):
    """Update an existing decryptor"""
    decryptors = get_decryptors()
    
    for i, d in enumerate(decryptors):
        if d.get('id') == decryptor_id:
            if decryptor_name:
                decryptors[i]['decryptor_name'] = decryptor_name
            if provider:
                decryptors[i]['provider'] = provider
            if provider_url:
                decryptors[i]['provider_url'] = provider_url
            if download_url:
                decryptors[i]['download_url'] = download_url
            if description:
                decryptors[i]['description'] = description
            if file_extensions is not None:
                decryptors[i]['file_extensions'] = [ext.strip() for ext in file_extensions.split(",") if ext.strip()]
            if status:
                decryptors[i]['status'] = status
            if release_date:
                decryptors[i]['release_date'] = release_date
            if notes is not None:
                decryptors[i]['notes'] = notes
            if how_to_guide_type is not None:
                decryptors[i]['how_to_guide_type'] = how_to_guide_type
            if how_to_guide_url is not None:
                decryptors[i]['how_to_guide_url'] = how_to_guide_url
            if how_to_guide_text is not None:
                decryptors[i]['how_to_guide_text'] = how_to_guide_text
            if detailed_description is not None:
                decryptors[i]['detailed_description'] = detailed_description
            decryptors[i]['updated_at'] = datetime.now().isoformat()
            
            save_decryptors(decryptors)
            return {"message": "Decryptor updated", "data": decryptors[i]}
    
    raise HTTPException(status_code=404, detail="Decryptor not found")

@app.delete("/api/v1/decryptors/{decryptor_id}", tags=["Decryptors"])
async def delete_decryptor(decryptor_id: str):
    """Delete a decryptor"""
    decryptors = get_decryptors()
    
    for i, d in enumerate(decryptors):
        if d.get('id') == decryptor_id:
            deleted = decryptors.pop(i)
            save_decryptors(decryptors)
            return {"message": "Decryptor deleted", "data": deleted}
    
    raise HTTPException(status_code=404, detail="Decryptor not found")

# ============================================================================
# File Upload API
# ============================================================================

@app.post("/api/v1/upload/pdf", tags=["Upload"])
async def upload_pdf(file: UploadFile = File(...)):
    """Upload a PDF file for how-to guide"""
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Generate unique filename
    import uuid
    file_id = str(uuid.uuid4())[:8]
    safe_filename = f"{file_id}_{file.filename.replace(' ', '_')}"
    file_path = UPLOADS_DIR / safe_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    return {
        "message": "File uploaded successfully",
        "filename": safe_filename,
        "url": f"/api/v1/uploads/{safe_filename}"
    }

@app.get("/api/v1/uploads/{filename}", tags=["Upload"])
async def get_uploaded_file(filename: str):
    """Get an uploaded file"""
    file_path = UPLOADS_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=filename
    )

@app.get("/api/v1/group-logo/{filename}", tags=["Groups"])
async def get_group_logo_file(filename: str):
    """Get a group logo image"""
    file_path = GROUP_LOGOS_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Logo not found")
    
    return FileResponse(
        path=file_path,
        media_type="image/png",
        filename=filename
    )

@app.post("/api/v1/groups/{group_name}/logo", tags=["Groups"])
async def upload_group_logo(group_name: str, file: UploadFile = File(...)):
    """Upload a logo for a specific group"""
    # Validate file type
    allowed_types = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico"]
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}")
    
    # Ensure logos directory exists
    GROUP_LOGOS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Remove old logos for this group
    normalized = group_name.lower().replace(' ', '').replace('-', '').replace('_', '')
    for old_logo in GROUP_LOGOS_DIR.glob("*"):
        old_name = old_logo.stem.lower().split('-')[0].replace(' ', '').replace('-', '').replace('_', '')
        if old_name == normalized:
            old_logo.unlink()
    
    # Save new logo with group name
    import hashlib
    file_hash = hashlib.md5(file.filename.encode()).hexdigest()[:8]
    logo_filename = f"{group_name.lower()}-{file_hash}{file_ext}"
    logo_path = GROUP_LOGOS_DIR / logo_filename
    
    try:
        with open(logo_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save logo: {str(e)}")
    finally:
        file.file.close()
    
    return {
        "message": "Logo uploaded successfully",
        "filename": logo_filename,
        "url": f"/api/v1/group-logo/{logo_filename}"
    }

@app.delete("/api/v1/groups/{group_name}/logo", tags=["Groups"])
async def delete_group_logo(group_name: str):
    """Delete logo for a specific group"""
    normalized = group_name.lower().replace(' ', '').replace('-', '').replace('_', '')
    deleted = False
    
    for logo_file in GROUP_LOGOS_DIR.glob("*"):
        file_name = logo_file.stem.lower().split('-')[0].replace(' ', '').replace('-', '').replace('_', '')
        if file_name == normalized:
            logo_file.unlink()
            deleted = True
    
    if not deleted:
        raise HTTPException(status_code=404, detail="No logo found for this group")
    
    return {"message": "Logo deleted successfully"}

@app.delete("/api/v1/uploads/{filename}", tags=["Upload"])
async def delete_uploaded_file(filename: str):
    """Delete an uploaded file"""
    file_path = UPLOADS_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        file_path.unlink()
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

# ============================================================================
# Site Content API (About page, Dashboard widgets)
# ============================================================================

SITE_CONTENT_FILE = DB_DIR / "site_content.json"

def load_site_content():
    """Load site content configuration"""
    if SITE_CONTENT_FILE.exists():
        with open(SITE_CONTENT_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"about": {}, "dashboard_widgets": []}

def save_site_content(content):
    """Save site content configuration"""
    with open(SITE_CONTENT_FILE, 'w', encoding='utf-8') as f:
        json.dump(content, f, indent=2, ensure_ascii=False)

@app.get("/api/v1/site-content", tags=["Site Content"])
async def get_site_content():
    """Get site content configuration"""
    return load_site_content()

@app.put("/api/v1/site-content/about", tags=["Site Content"])
async def update_about_content(
    hero_title: str = Query(None),
    hero_subtitle: str = Query(None),
    hero_description: str = Query(None),
    main_description: str = Query(None),
    secondary_description: str = Query(None),
    community_description: str = Query(None),
    contact_email: str = Query(None),
    security_email: str = Query(None),
    partners_email: str = Query(None),
    website_url: str = Query(None),
    discord_url: str = Query(None),
    telegram_url: str = Query(None),
    twitter_url: str = Query(None)
):
    """Update About page content"""
    content = load_site_content()
    
    if 'about' not in content:
        content['about'] = {}
    
    updates = {
        'hero_title': hero_title, 'hero_subtitle': hero_subtitle,
        'hero_description': hero_description, 'main_description': main_description,
        'secondary_description': secondary_description, 'community_description': community_description,
        'contact_email': contact_email, 'security_email': security_email,
        'partners_email': partners_email, 'website_url': website_url,
        'discord_url': discord_url, 'telegram_url': telegram_url, 'twitter_url': twitter_url
    }
    
    for key, value in updates.items():
        if value is not None:
            content['about'][key] = value
    
    save_site_content(content)
    return {"message": "About content updated", "data": content['about']}

@app.get("/api/v1/site-content/widgets", tags=["Site Content"])
async def get_dashboard_widgets():
    """Get dashboard widget configuration"""
    content = load_site_content()
    return content.get('dashboard_widgets', [])

@app.put("/api/v1/site-content/widgets/{widget_id}", tags=["Site Content"])
async def update_widget(
    widget_id: str,
    enabled: bool = Query(None),
    order: int = Query(None),
    title: str = Query(None)
):
    """Update a dashboard widget"""
    content = load_site_content()
    widgets = content.get('dashboard_widgets', [])
    
    for widget in widgets:
        if widget.get('id') == widget_id:
            if enabled is not None:
                widget['enabled'] = enabled
            if order is not None:
                widget['order'] = order
            if title is not None:
                widget['title'] = title
            save_site_content(content)
            return {"message": "Widget updated", "data": widget}
    
    raise HTTPException(status_code=404, detail="Widget not found")

# ============================================================================
# Groups Management API
# ============================================================================

@app.put("/api/v1/groups/{group_name}/profile", tags=["Groups"])
async def update_group_profile(
    group_name: str,
    description: str = Query(None),
    meta: str = Query(None),
    first_seen: str = Query(None),
    country_origin: str = Query(None),
    targets: str = Query(None),
    extensions: str = Query(None)
):
    """Update group profile information"""
    groups = get_groups()
    
    for i, group in enumerate(groups):
        if group.get('name', '').lower() == group_name.lower():
            # Initialize profile if not exists
            if 'profile' not in groups[i] or not isinstance(groups[i]['profile'], list):
                groups[i]['profile'] = []
            
            # Update fields
            if description is not None:
                groups[i]['description'] = description
            if meta is not None:
                groups[i]['meta'] = meta
            
            # Update or add profile entries
            profile_updates = {}
            if first_seen:
                profile_updates['First Seen'] = first_seen
            if country_origin:
                profile_updates['Country of Origin'] = country_origin
            if targets:
                profile_updates['Targets'] = targets
            if extensions:
                profile_updates['File Extensions'] = extensions
            
            for key, value in profile_updates.items():
                # Check if profile entry exists
                found = False
                for j, entry in enumerate(groups[i]['profile']):
                    if isinstance(entry, str) and entry.startswith(f"{key}:"):
                        groups[i]['profile'][j] = f"{key}: {value}"
                        found = True
                        break
                if not found:
                    groups[i]['profile'].append(f"{key}: {value}")
            
            # Save to file
            with open(GROUPS_FILE, 'w', encoding='utf-8') as f:
                json.dump(groups, f, indent=2, ensure_ascii=False)
            
            return {"message": "Group profile updated", "data": groups[i]}
    
    raise HTTPException(status_code=404, detail="Group not found")

@app.get("/api/v1/groups/{group_name}/details", tags=["Groups"])
async def get_group_details(group_name: str):
    """Get detailed group information for editing"""
    groups = get_groups()
    
    for group in groups:
        if group.get('name', '').lower() == group_name.lower():
            return {
                "name": group.get('name'),
                "description": group.get('description', ''),
                "meta": group.get('meta', ''),
                "captcha": group.get('captcha', False),
                "parser": group.get('parser', True),
                "javascript_render": group.get('javascript_render', False),
                "profile": group.get('profile', []),
                "locations": group.get('locations', []),
                "logo_url": get_group_logo(group.get('name', ''))
            }
    
    raise HTTPException(status_code=404, detail="Group not found")

# Logo scraping background task
_logo_scrape_in_progress = False
_logo_scrape_results = {"status": "idle", "scraped": 0, "total": 0, "errors": []}

def run_logo_scrape_background(group_name: str = None):
    """Run logo scraping in background"""
    global _logo_scrape_in_progress, _logo_scrape_results
    
    _logo_scrape_in_progress = True
    _logo_scrape_results = {"status": "running", "scraped": 0, "total": 0, "errors": []}
    
    try:
        cmd = ["python3", str(BIN_DIR / "scrape_logos.py")]
        if group_name:
            cmd.extend(["--group", group_name])
        else:
            cmd.append("--all")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=3600  # 1 hour timeout
        )
        
        # Parse results from output
        output = result.stdout + result.stderr
        scraped_count = output.count("✓ Saved logo")
        
        _logo_scrape_results = {
            "status": "completed",
            "scraped": scraped_count,
            "output": output[-2000:] if len(output) > 2000 else output  # Last 2000 chars
        }
    except subprocess.TimeoutExpired:
        _logo_scrape_results = {"status": "timeout", "error": "Logo scraping timed out"}
    except Exception as e:
        _logo_scrape_results = {"status": "error", "error": str(e)}
    finally:
        _logo_scrape_in_progress = False

@app.post("/api/v1/scrape-logos", tags=["System"])
async def trigger_logo_scrape(background_tasks: BackgroundTasks, group: str = Query(None)):
    """Trigger logo scraping for all groups or a specific group"""
    global _logo_scrape_in_progress
    
    if _logo_scrape_in_progress:
        return {"status": "already_running", "message": "Logo scraping is already in progress"}
    
    background_tasks.add_task(run_logo_scrape_background, group)
    
    return {
        "status": "started",
        "message": f"Logo scraping started for {'group: ' + group if group else 'all groups'}"
    }

@app.get("/api/v1/scrape-logos/status", tags=["System"])
async def get_logo_scrape_status():
    """Get status of logo scraping"""
    global _logo_scrape_in_progress, _logo_scrape_results
    
    return {
        "in_progress": _logo_scrape_in_progress,
        **_logo_scrape_results
    }

# ============================================================================
# Export API (CSV, JSON, STIX)
# ============================================================================

from fastapi.responses import StreamingResponse
import io
import csv

@app.get("/api/v1/export/victims/csv", tags=["Export"])
async def export_victims_csv(
    group: Optional[str] = Query(None, description="Filter by group name"),
    country: Optional[str] = Query(None, description="Filter by country"),
    days: Optional[int] = Query(None, description="Last N days only")
):
    """Export victims data as CSV"""
    victims = get_victims()
    
    # Apply filters
    filtered = victims
    if group:
        filtered = [v for v in filtered if v.get('group_name', '').lower() == group.lower()]
    if country:
        filtered = [v for v in filtered if v.get('country', '').upper() == country.upper()]
    if days:
        cutoff = datetime.now() - timedelta(days=days)
        filtered = [v for v in filtered if datetime.strptime(v.get('discovered', '1970-01-01')[:10], '%Y-%m-%d') >= cutoff]
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['post_title', 'group_name', 'discovered', 'country', 'activity', 'website', 'description'])
    
    for v in filtered:
        writer.writerow([
            v.get('post_title', ''),
            v.get('group_name', ''),
            v.get('discovered', ''),
            v.get('country', ''),
            v.get('activity', ''),
            v.get('website', ''),
            v.get('description', '')[:500] if v.get('description') else ''
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=dragons-eye-victims-{datetime.now().strftime('%Y%m%d')}.csv"}
    )

@app.get("/api/v1/export/victims/json", tags=["Export"])
async def export_victims_json(
    group: Optional[str] = Query(None, description="Filter by group name"),
    country: Optional[str] = Query(None, description="Filter by country"),
    days: Optional[int] = Query(None, description="Last N days only"),
    limit: int = Query(1000, ge=1, le=10000, description="Maximum records")
):
    """Export victims data as JSON"""
    victims = get_victims()
    
    # Apply filters
    filtered = victims
    if group:
        filtered = [v for v in filtered if v.get('group_name', '').lower() == group.lower()]
    if country:
        filtered = [v for v in filtered if v.get('country', '').upper() == country.upper()]
    if days:
        cutoff = datetime.now() - timedelta(days=days)
        filtered = [v for v in filtered if datetime.strptime(v.get('discovered', '1970-01-01')[:10], '%Y-%m-%d') >= cutoff]
    
    # Limit results
    filtered = filtered[:limit]
    
    return JSONResponse(
        content={"exported_at": datetime.now().isoformat(), "count": len(filtered), "data": filtered},
        headers={"Content-Disposition": f"attachment; filename=dragons-eye-victims-{datetime.now().strftime('%Y%m%d')}.json"}
    )

@app.get("/api/v1/export/victims/stix", tags=["Export"])
async def export_victims_stix(
    group: Optional[str] = Query(None, description="Filter by group name"),
    days: Optional[int] = Query(30, description="Last N days only"),
    limit: int = Query(500, ge=1, le=5000, description="Maximum records")
):
    """Export victims data in STIX 2.1 format"""
    victims = get_victims()
    groups = get_groups()
    
    # Apply filters
    filtered = victims
    if group:
        filtered = [v for v in filtered if v.get('group_name', '').lower() == group.lower()]
    if days:
        cutoff = datetime.now() - timedelta(days=days)
        try:
            filtered = [v for v in filtered if datetime.strptime(v.get('discovered', '1970-01-01')[:10], '%Y-%m-%d') >= cutoff]
        except:
            pass
    
    filtered = filtered[:limit]
    
    # Create STIX bundle
    stix_objects = []
    
    # Add identity for Dragons Eye
    identity_id = "identity--d8e4f5a6-b7c8-4d9e-a0f1-234567890abc"
    stix_objects.append({
        "type": "identity",
        "spec_version": "2.1",
        "id": identity_id,
        "created": datetime.now().isoformat() + "Z",
        "modified": datetime.now().isoformat() + "Z",
        "name": "Dragons Eye Ransomware Tracker",
        "identity_class": "organization",
        "description": "Threat intelligence platform by Dragons Community"
    })
    
    # Create threat actors for groups
    group_ids = {}
    for g in groups:
        gname = g.get('name', '')
        if gname and any(v.get('group_name', '').lower() == gname.lower() for v in filtered):
            ta_id = f"threat-actor--{gname.lower().replace(' ', '-')}-{hash(gname) % 100000:05d}"
            group_ids[gname.lower()] = ta_id
            
            is_active = any(loc.get('available', False) for loc in g.get('locations', []))
            
            stix_objects.append({
                "type": "threat-actor",
                "spec_version": "2.1",
                "id": ta_id,
                "created": datetime.now().isoformat() + "Z",
                "modified": datetime.now().isoformat() + "Z",
                "name": gname,
                "description": g.get('description') or g.get('meta') or f"Ransomware group: {gname}",
                "threat_actor_types": ["crime-syndicate"],
                "primary_motivation": "financial-gain",
                "is_active": is_active,
                "created_by_ref": identity_id
            })
    
    # Create incidents for victims
    for v in filtered:
        victim_name = v.get('post_title', 'Unknown')
        group_name = v.get('group_name', '').lower()
        discovered = v.get('discovered', datetime.now().isoformat())
        
        incident_id = f"incident--{hash(victim_name + group_name + discovered) % 1000000000:09d}"
        
        incident = {
            "type": "incident",
            "spec_version": "2.1",
            "id": incident_id,
            "created": datetime.now().isoformat() + "Z",
            "modified": datetime.now().isoformat() + "Z",
            "name": f"Ransomware attack on {victim_name}",
            "description": v.get('description', f"{victim_name} was listed by {v.get('group_name', 'unknown')} ransomware group"),
            "created_by_ref": identity_id,
            "external_references": [
                {
                    "source_name": "Dragons Eye",
                    "description": "Original victim listing"
                }
            ]
        }
        
        # Add custom properties
        incident["x_victim_name"] = victim_name
        incident["x_group_name"] = v.get('group_name', '')
        incident["x_country"] = v.get('country', '')
        incident["x_sector"] = v.get('activity', '')
        incident["x_website"] = v.get('website', '')
        incident["x_discovered"] = discovered
        
        stix_objects.append(incident)
        
        # Create relationship to threat actor
        if group_name in group_ids:
            rel_id = f"relationship--{hash(incident_id + group_ids[group_name]) % 1000000000:09d}"
            stix_objects.append({
                "type": "relationship",
                "spec_version": "2.1",
                "id": rel_id,
                "created": datetime.now().isoformat() + "Z",
                "modified": datetime.now().isoformat() + "Z",
                "relationship_type": "attributed-to",
                "source_ref": incident_id,
                "target_ref": group_ids[group_name],
                "created_by_ref": identity_id
            })
    
    # Create STIX bundle
    stix_bundle = {
        "type": "bundle",
        "id": f"bundle--{datetime.now().strftime('%Y%m%d%H%M%S')}-{hash(str(filtered)) % 10000:04d}",
        "objects": stix_objects
    }
    
    return JSONResponse(
        content=stix_bundle,
        headers={"Content-Disposition": f"attachment; filename=dragons-eye-stix-{datetime.now().strftime('%Y%m%d')}.json"}
    )

@app.get("/api/v1/export/groups/csv", tags=["Export"])
async def export_groups_csv():
    """Export groups data as CSV"""
    groups = get_groups()
    victims = get_victims()
    
    # Count victims per group
    victim_counts = Counter(v.get('group_name', '') for v in victims)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['name', 'victim_count', 'is_active', 'locations_count', 'has_parser', 'meta'])
    
    for g in groups:
        name = g.get('name', '')
        locations = g.get('locations', [])
        is_active = any(loc.get('available', False) for loc in locations)
        
        writer.writerow([
            name,
            victim_counts.get(name, 0),
            is_active,
            len(locations),
            g.get('parser', False),
            g.get('meta', '')
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=dragons-eye-groups-{datetime.now().strftime('%Y%m%d')}.csv"}
    )

# ============================================================================
# RSS Feed
# ============================================================================

@app.get("/api/v1/rss/victims", tags=["RSS"])
async def rss_victims_feed(
    limit: int = Query(50, ge=10, le=100, description="Number of items in feed")
):
    """RSS feed for latest victims"""
    victims = get_victims()
    
    # Sort by discovered date
    def get_date(v):
        try:
            return datetime.strptime(v.get('discovered', '1970-01-01')[:19], '%Y-%m-%d %H:%M:%S')
        except:
            return datetime(1970, 1, 1)
    
    victims.sort(key=get_date, reverse=True)
    latest = victims[:limit]
    
    # Build RSS XML
    rss_items = []
    for v in latest:
        title = v.get('post_title', 'Unknown')
        group = v.get('group_name', 'Unknown')
        country = v.get('country', '')
        sector = v.get('activity', '')
        discovered = v.get('discovered', '')
        description = v.get('description', '')
        
        # Format pub date for RSS
        try:
            pub_date = datetime.strptime(discovered[:19], '%Y-%m-%d %H:%M:%S')
            pub_date_str = pub_date.strftime('%a, %d %b %Y %H:%M:%S +0000')
        except:
            pub_date_str = datetime.now().strftime('%a, %d %b %Y %H:%M:%S +0000')
        
        item_desc = f"<![CDATA[<p><strong>Group:</strong> {group}</p>"
        if country:
            item_desc += f"<p><strong>Country:</strong> {country}</p>"
        if sector:
            item_desc += f"<p><strong>Industry:</strong> {sector}</p>"
        if description:
            item_desc += f"<p>{description[:500]}</p>"
        item_desc += "]]>"
        
        rss_items.append(f"""
        <item>
            <title>{title} - {group}</title>
            <description>{item_desc}</description>
            <pubDate>{pub_date_str}</pubDate>
            <guid isPermaLink="false">victim-{hash(title + group + discovered) % 1000000000}</guid>
            <category>{group}</category>
            {f'<category>{country}</category>' if country else ''}
            {f'<category>{sector}</category>' if sector else ''}
        </item>""")
    
    rss_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Dragons Eye - Ransomware Victims Feed</title>
        <link>https://dragonseye.io</link>
        <description>Latest ransomware victims tracked by Dragons Eye Ransomware Tracker</description>
        <language>en-us</language>
        <lastBuildDate>{datetime.now().strftime('%a, %d %b %Y %H:%M:%S +0000')}</lastBuildDate>
        <atom:link href="https://dragonseye.io/api/v1/rss/victims" rel="self" type="application/rss+xml"/>
        <ttl>30</ttl>
        {''.join(rss_items)}
    </channel>
</rss>"""
    
    return StreamingResponse(
        iter([rss_content]),
        media_type="application/rss+xml",
        headers={"Content-Type": "application/rss+xml; charset=utf-8"}
    )

@app.get("/api/v1/rss/groups", tags=["RSS"])
async def rss_groups_feed():
    """RSS feed for group activity updates"""
    groups = get_groups()
    victims = get_victims()
    
    # Get recent activity per group
    group_activity = {}
    for v in victims:
        gname = v.get('group_name', '')
        discovered = v.get('discovered', '')
        if gname and discovered:
            if gname not in group_activity or discovered > group_activity[gname]:
                group_activity[gname] = discovered
    
    # Sort groups by recent activity
    sorted_groups = sorted(groups, key=lambda g: group_activity.get(g.get('name', ''), ''), reverse=True)[:30]
    
    rss_items = []
    victim_counts = Counter(v.get('group_name', '') for v in victims)
    
    for g in sorted_groups:
        name = g.get('name', '')
        locations = g.get('locations', [])
        is_active = any(loc.get('available', False) for loc in locations)
        count = victim_counts.get(name, 0)
        last_activity = group_activity.get(name, '')
        
        try:
            pub_date = datetime.strptime(last_activity[:19], '%Y-%m-%d %H:%M:%S')
            pub_date_str = pub_date.strftime('%a, %d %b %Y %H:%M:%S +0000')
        except:
            pub_date_str = datetime.now().strftime('%a, %d %b %Y %H:%M:%S +0000')
        
        status = "Active" if is_active else "Inactive"
        
        rss_items.append(f"""
        <item>
            <title>{name} - {count} victims ({status})</title>
            <description><![CDATA[<p>Ransomware group <strong>{name}</strong> has {count} known victims. Status: {status}.</p>]]></description>
            <pubDate>{pub_date_str}</pubDate>
            <guid isPermaLink="false">group-{name}-{count}</guid>
            <category>ransomware</category>
            <category>{status.lower()}</category>
        </item>""")
    
    rss_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Dragons Eye - Ransomware Groups Feed</title>
        <link>https://dragonseye.io</link>
        <description>Ransomware group activity updates from Dragons Eye</description>
        <language>en-us</language>
        <lastBuildDate>{datetime.now().strftime('%a, %d %b %Y %H:%M:%S +0000')}</lastBuildDate>
        <atom:link href="https://dragonseye.io/api/v1/rss/groups" rel="self" type="application/rss+xml"/>
        <ttl>60</ttl>
        {''.join(rss_items)}
    </channel>
</rss>"""
    
    return StreamingResponse(
        iter([rss_content]),
        media_type="application/rss+xml",
        headers={"Content-Type": "application/rss+xml; charset=utf-8"}
    )

# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    print("""
    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║     🐉  DRAGONS - RANSOMWARE MONITORING API                      ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
    """)
    
    # Production mode check
    IS_PRODUCTION = os.environ.get("ENVIRONMENT", "development") == "production"
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        reload=not IS_PRODUCTION,  # Disable reload in production
        log_level="warning" if IS_PRODUCTION else "info",
        access_log=not IS_PRODUCTION
    )

