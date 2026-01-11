<p align="center">
  <img src=".github/logo.png" alt="Dragons Eye" width="150" height="150">
</p>

<h1 align="center">🐉 Dragons Eye - Ransomware Tracker</h1>

<p align="center">
  <strong>AI-Powered Threat Intelligence Platform for Ransomware Monitoring</strong><br>
  <em>Powered by Machine Learning & Real-time Dark Web Analysis</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#monitoring">Monitoring</a> •
  <a href="#api">API</a> •
  <a href="#frontend">Frontend</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AI%20Powered-GPT--4-blueviolet" alt="AI Powered">
  <img src="https://img.shields.io/badge/Groups-306+-red" alt="Groups">
  <img src="https://img.shields.io/badge/Victims-24,000+-orange" alt="Victims">
  <img src="https://img.shields.io/badge/Parsers-109-green" alt="Parsers">
  <img src="https://img.shields.io/badge/Auto--Update-30min-blue" alt="Auto Update">
</p>

---

## 🐲 About Dragons Eye

**Dragons Eye** is the umbrella name for threat intelligence tools developed by **Dragons Community**. This Ransomware Tracker is a powerful, open-source platform designed to monitor, track, and analyze ransomware leak sites across the dark web.

Built for security researchers, threat analysts, and SOC teams, Dragons Eye provides:
- 🔄 **Automated scraping** every 30 minutes
- 🛡️ **Protection page bypass** with retry logic
- 🌐 **Modern web dashboard** for visualization
- 🤖 **AI-powered enrichment** for victim data
- 📊 **Real-time statistics** and analytics

> ⚠️ **Disclaimer**: This tool is for **research and educational purposes only**. Developed and maintained by Dragons Community members.

---

## 🖥️ CLI-Only Usage (No Frontend Required)

You can use Dragons Eye as a standalone CLI tool without the frontend. Perfect for:
- 🔬 Security researchers
- 🤖 Automated threat intel pipelines
- 📊 Data collection scripts
- 🔗 Integration with other tools

### Quick Start (CLI Only)

```bash
# 1. Clone and setup
git clone https://github.com/dragons-community/DragonsEye-RansomwareTracker.git
cd DragonsEye-RansomwareTracker

# 2. Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Install Playwright browsers
playwright install firefox

# 4. Configure environment
cp env.example .env
nano .env  # Add your settings

# 5. Start Tor (required for .onion sites)
# macOS: brew services start tor
# Linux: sudo systemctl start tor
```

### CLI Commands

```bash
# 🔍 Scrape all groups
python3 bin/scrape.py --all

# 🔍 Scrape specific group
python3 bin/scrape.py --group lockbit3

# 📊 Parse scraped data
python3 bin/parse.py --all

# 📈 Check system status
python3 bin/status.py

# 🔄 Full update (scrape + parse)
python3 bin/scrape.py --all && python3 bin/parse.py --all

# 📋 Export data
cat db/victims.json | jq '.[] | select(.group_name=="lockbit3")'
```

### API Server (Optional)

```bash
# Start API server for REST access
python3 api/main.py

# API endpoints:
# GET http://localhost:8000/api/v1/victims
# GET http://localhost:8000/api/v1/groups
# GET http://localhost:8000/api/v1/statistics
```

### Data Files

| File | Description |
|------|-------------|
| `db/victims.json` | All victim records |
| `db/groups.json` | Group configurations |
| `db/decryptors.json` | Available decryptors |
| `db/ransom_notes.json` | Ransom notes collection |

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Automated Scraping** | Scrape 300+ ransomware leak sites including `.onion` domains via Tor |
| 🔄 **Auto-Update Scheduler** | Automatic scrape + parse every 30 minutes |
| 🛡️ **Protection Bypass** | Intelligent retry with DDoS/Captcha detection |
| 📊 **Modern Dashboard** | Next.js frontend with interactive world map |
| 🌐 **REST API** | FastAPI backend with comprehensive endpoints |
| 📸 **Screenshot Capture** | Automatic screenshots with watermarking |
| 🤖 **AI Enrichment** | OpenAI/LM Studio integration for victim profiling |
| 📈 **HTTP Fingerprinting** | Server identification and security header analysis |
| 📝 **Emoji Logging** | Clear, visual log output for easy monitoring |

---

## 📂 Project Structure

```
DragonsEye-RansomwareTracker/
│
├── api/                          # FastAPI Backend
│   └── main.py                   # API server with auto-scheduler
│
├── bin/                          # Core Python Scripts
│   ├── _parsers/                 # Individual group parsers (109)
│   ├── scrape.py                 # Main scraping engine
│   ├── parse.py                  # Data parsing orchestrator
│   ├── status.py                 # 📊 System status monitor
│   ├── manage.py                 # CLI management tool
│   ├── shared_utils.py           # Shared utilities
│   ├── libcapture.py             # Screenshot utilities
│   ├── enrich_existing.py        # AI enrichment script
│   └── fetch_ransom_notes.py     # Ransom notes fetcher
│
├── db/                           # JSON Databases
│   ├── victims.json              # Victim records (24,000+)
│   ├── groups.json               # Group configurations (306)
│   ├── decryptors.json           # Decryptor tools
│   ├── ransom_notes.json         # Ransom notes collection
│   └── negotiations_data.json    # Negotiation chats
│
├── images/                       # Static Assets
│   ├── groups/                   # Group screenshots & logos
│   └── victims/                  # Victim page screenshots
│
├── logs/                         # Log Files
│   └── update_latest.log         # Latest update log
│
├── tmp/                          # Temporary/Cache Files
│   ├── *.html                    # Scraped HTML files
│   └── scheduler_status.json     # Scheduler status
│
├── env.example                   # Environment template (copy to .env)
└── requirements.txt              # Python dependencies
```

---

## ⚙️ Installation

### Prerequisites

- **Python 3.9+**
- **Node.js 18+** (for frontend)
- **Tor service** running locally
- **Playwright** browsers installed

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/dragons-community/DragonsEye-RansomwareTracker.git
cd DragonsEye-RansomwareTracker

# 2. Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Install Playwright browsers
playwright install firefox chromium

# 5. Install frontend dependencies
cd frontend
npm install
cd ..

# 6. Configure environment
cp env.example .env
nano .env  # Edit with your settings
```

### Environment Variables

```env
# Dragons Core Configuration
DRAGONS_HOME=/path/to/DragonsEye-RansomwareTracker
DB_DIR=/db
IMAGES_DIR=/images
TMP_DIR=/tmp

# Tor Configuration
TOR_PROXY_SERVER=socks5://127.0.0.1:9050

# AI Enrichment (Optional)
OPENAI_API_KEY=sk-your-openai-key
# Or for local LM Studio:
OPENAI_BASE_URL=http://localhost:1234/v1
```

---

## 🚀 Quick Start

### Start Everything (Recommended)

```bash
# Terminal 1: Start API (includes auto-scheduler)
python3 api/main.py

# Terminal 2: Start Frontend
cd frontend && npm run dev
```

**That's it!** 
- API runs on: http://localhost:8000
- Frontend runs on: http://localhost:3000
- Auto-update runs every **30 minutes**

---

## 📊 Monitoring

### Check System Status

```bash
# Quick status
python3 bin/status.py

# Verbose status (with recent victims)
python3 bin/status.py -v

# Live monitoring (refreshes every 10s)
python3 bin/status.py --watch
```

**Example Output:**
```
======================================================================
🐉 DRAGONS EYE - SYSTEM STATUS
======================================================================
⏰ Check time: 2026-01-09 02:56:44

📡 API STATUS:
   ✅ API Running
   📊 Data Freshness: fresh
   📁 Victims Age: 1h 1m
   🕐 Scheduler: idle

📄 HTML FILES:
   📋 Total: 176 files
   ✅ Real Data: 152 files
   🛡️ Protection Page: 24 files
   📈 Success Rate: 86.4%

👥 DATABASE:
   📊 Total Victims: 24,765
   🆕 Added Today: 10
   🏴 Total Groups: 306 (71 active)
======================================================================
```

### Watch Logs

```bash
# Follow update logs
tail -f logs/update_latest.log

# Follow API logs
tail -f logs/api.log
```

---

## 🔧 Manual Operations

### Scraping

```bash
cd bin

# Scrape all groups (verbose)
python3 scrape.py -V

# Scrape specific group
python3 scrape.py -G qilin -V

# Force scrape (bypass enabled flag)
python3 scrape.py -B -V
```

**Scrape Output with Emojis:**
```
[02:56:44] 🚀 [qilin] Scraping http://ijzn3si...
[02:57:30] ✅ [qilin] OK (78KB) - Qilin blog
[02:57:35] 🛡️ [clop] DDoS Protection - bypass failed
[02:57:40] ⏰ [anubis] Timeout - http://om6q4a...
[02:57:45] 🔄 [lockbit5] Attempt 2 failed, retrying...

📊 SCRAPE RESULT SUMMARY
============================================================
  ✅ Success:      152
  🛡️ Protected:    24
  ⏰ Timeout:      8
  ❌ Error:        3
  ⏭️ Skipped:      45
============================================================
```

### Parsing

```bash
cd bin

# Parse all groups
python3 parse.py

# Parse specific group
python3 parse.py -G lockbit3

# Force parse (remove lock)
python3 parse.py -F
```

### AI Enrichment

```bash
cd bin

# Enrich existing victims (activity/sector only)
python3 enrich_activity_only.py --limit 100

# Full enrichment
python3 enrich_existing.py --limit 50
```

---

## 🌐 API Endpoints

Base URL: `http://localhost:8000/api/v1`

| Endpoint | Description |
|----------|-------------|
| `GET /victims` | List victims (paginated) |
| `GET /victims/{id}` | Get victim by ID |
| `GET /groups` | List all groups |
| `GET /groups/{name}` | Get group details |
| `GET /stats/summary` | Overall statistics |
| `GET /stats/countries` | Country breakdown |
| `GET /stats/sectors` | Sector breakdown |
| `GET /stats/trend` | Attack trend (30 days) |
| `GET /status` | System status |
| `POST /update/trigger` | Trigger manual update |
| `GET /decryptors` | List decryptors |
| `GET /ransom-notes` | List ransom notes |
| `GET /negotiations` | List negotiation chats |

### Example API Calls

```bash
# Get latest 10 victims
curl "http://localhost:8000/api/v1/victims?limit=10&sort=desc"

# Get statistics
curl "http://localhost:8000/api/v1/stats/summary"

# Trigger manual update
curl -X POST "http://localhost:8000/api/v1/update/trigger"

# Check status
curl "http://localhost:8000/api/v1/status"
```

---

## 🎨 Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Overview with stats, map, latest victims |
| Victims | `/victims` | Searchable victim list |
| Victim Detail | `/victims/[id]` | Individual victim info |
| Groups | `/groups` | Ransomware group list |
| Group Detail | `/groups/[id]` | Group profile & victims |
| Countries | `/country` | Country analysis |
| Industries | `/industry` | Sector analysis |
| Statistics | `/statistics` | Charts & trends |
| Negotiations | `/negotiation` | Chat logs |
| Decryptors | `/decryptors` | Available tools |
| Ransom Notes | `/ransom-notes` | Note collection |
| About | `/about` | About Dragons Community |

---

## 🔄 Auto-Update System

The system automatically updates every **30 minutes**:

1. **Scrape Phase**: Fetch HTML from all enabled group sites
2. **Parse Phase**: Extract victim data from HTML
3. **Cache Clear**: Refresh API cache for new data
4. **Status Update**: Update scheduler status file

### Scheduler Configuration

In `api/main.py`:
```python
UPDATE_INTERVAL_MINUTES = 30  # Update every 30 minutes
RUN_ON_STARTUP = True         # Run update immediately on startup
```

---

## 🛡️ Protection Page Handling

Dragons Eye includes intelligent protection page detection:

| Protection Type | Detection | Handling |
|-----------------|-----------|----------|
| DDoS Protection | ✅ | Retry with longer wait |
| Captcha | ✅ | Retry 3x, then skip |
| Cloudflare | ✅ | JS render + wait |
| JS Challenge | ✅ | Extended wait time |

**Retry Logic:**
- Attempt 1: 60s wait
- Attempt 2: 90s wait  
- Attempt 3: 120s wait
- Then mark as blocked

---

## 📋 Command Reference

| Command | Description |
|---------|-------------|
| `python3 api/main.py` | Start API + scheduler |
| `npm run dev` (frontend/) | Start frontend |
| `python3 bin/status.py` | Check status |
| `python3 bin/status.py -v` | Verbose status |
| `python3 bin/status.py --watch` | Live monitoring |
| `python3 bin/scrape.py -V` | Manual scrape |
| `python3 bin/scrape.py -G <name>` | Scrape single group |
| `python3 bin/parse.py` | Manual parse |
| `python3 bin/parse.py -F` | Force parse |
| `tail -f logs/update_latest.log` | Watch update log |

---

## 🤝 Contributing

Contributions are welcome! Areas of interest:

- **New Parsers**: Add support for new ransomware groups
- **Protection Bypass**: Improve captcha/DDoS handling
- **Frontend**: UI/UX improvements
- **Documentation**: Help improve docs

### Adding a New Parser

Create `bin/_parsers/newgroup.py`:

```python
from shared_utils import stdlog, errlog, appender
from bs4 import BeautifulSoup

def parse(html_content, group_name, location):
    soup = BeautifulSoup(html_content, 'html.parser')
    
    for victim in soup.find_all('div', class_='victim'):
        name = victim.find('h2').text.strip()
        appender(
            victim=name,
            group_name=group_name,
            description='',
            website='',
            post_url=location['slug']
        )
```

---

## 📜 License

This project is released under the **Unlicense** - see the [LICENSE](LICENSE) file.

---

## ⚠️ Legal Disclaimer

**Dragons Eye** is provided for **research and educational purposes only**.

- Do **NOT** use for unauthorized access
- Do **NOT** engage with ransomware operators
- Do **NOT** pay ransoms
- **DO** report findings to appropriate authorities

Developed by Dragons Community. The maintainers assume no liability for misuse.

---

## 📬 Contact & Community

- **GitHub**: [Dragons-Community](https://github.com/Dragons-Community)
- **X (Twitter)**: [@DragonsCyberHQ](https://x.com/DragonsCyberHQ)
- **Support**: support@dragons.community

---

<p align="center">
  <br>
  <strong>🐉 Dragons Eye - Ransomware Tracker</strong><br>
  <em>Made with 🔥 by Dragons Community for the cybersecurity community</em>
</p>

<p align="center">
  <strong>👨‍💻 Developers</strong><br>
  <a href="https://github.com/irem-kaymak"><img src="https://img.shields.io/badge/I--Rem-irem--kaymak-181717?style=flat&logo=github" alt="I-Rem"></a>
  <a href="https://github.com/frknaykc"><img src="https://img.shields.io/badge/NaxoziwuS-frknaykc-181717?style=flat&logo=github" alt="NaxoziwuS"></a>
</p>
