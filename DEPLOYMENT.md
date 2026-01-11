# 🚀 DragonsEye Deployment Guide

## 📁 Repository Stratejisi

Bu proje iki ayrı GitHub repository olarak yönetilir:

| Repository | Visibility | İçerik | Kullanım |
|------------|------------|--------|----------|
| `DragonsEye-RansomwareTracker` | **PRIVATE** | Full proje (frontend dahil) | Geliştirme & Vercel |
| `DragonsEye-RansomwareTracker` | **PUBLIC** | Backend + DB (CLI kullanım) | Açık kaynak paylaşım |

---

## 🔒 PRIVATE Repo (Full Project)

### İçerik
```
DragonsEye-RansomwareTracker/
├── api/                 ✅
├── bin/                 ✅
├── db/                  ✅
├── frontend/            ✅ (sadece burada)
├── images/              ✅
├── .env                 ✅ (gerçek secrets)
├── logs/                ✅
├── tmp/                 ✅
└── ... herşey
```

### Kurulum

```bash
# Yeni private repo oluştur: DragonsEye-RansomwareTracker (PRIVATE)

cd /path/to/full-project
git init
git add .
git commit -m "🐉 Full project - Private"
git remote add origin https://github.com/USER/DragonsEye-RansomwareTracker.git
git push -u origin main
```

### Vercel Deployment

1. Vercel.com → New Project
2. GitHub'dan PRIVATE `DragonsEye-RansomwareTracker` repo'yu seç
3. **Root Directory**: `frontend` olarak ayarla
4. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.dragons.community
   ```
5. Deploy!

---

## 🌍 PUBLIC Repo (Open Source)

### İçerik
```
DragonsEye-RansomwareTracker/
├── api/                 ✅
├── bin/                 ✅
├── db/                  ✅
├── images/              ✅
├── env.example          ✅ (şablon, secret yok)
├── requirements.txt     ✅
├── README.md            ✅
├── SECURITY.md          ✅
├── LICENSE              ✅
│
├── frontend/            ❌ YOK
├── .env                 ❌ YOK
├── logs/                ❌ YOK
└── tmp/                 ❌ YOK
```

### Kurulum

```bash
# 1. Ayrı bir klasör oluştur
mkdir ~/Desktop/DragonsEye-Public
cd ~/Desktop/DragonsEye-Public

# 2. Sadece gerekli dosyaları kopyala
cp -r /original/project/api .
cp -r /original/project/bin .
cp -r /original/project/db .
cp -r /original/project/images .
cp -r /original/project/etc .
cp -r /original/project/static .
cp /original/project/env.example .
cp /original/project/requirements.txt .
cp /original/project/README.md .
cp /original/project/SECURITY.md .
cp /original/project/DEPLOYMENT.md .
cp /original/project/LICENSE .
cp /original/project/groups_urls.csv .
cp /original/project/.gitignore .

# 3. Git başlat ve push
git init
git add .
git commit -m "🐉 DragonsEye RansomwareTracker - Open Source Release"
git remote add origin https://github.com/USER/DragonsEye-RansomwareTracker.git
git push -u origin main
```

### Public Repo Kullanıcıları İçin

```bash
# Klonla
git clone https://github.com/USER/DragonsEye-RansomwareTracker.git
cd DragonsEye-RansomwareTracker

# Setup
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install firefox

# Configure
cp env.example .env
nano .env  # Settings'i düzenle

# Çalıştır
python3 bin/scrape.py --all
python3 bin/status.py
```

---

## 🖥️ Backend Server Deployment

### Systemd Service

```bash
sudo nano /etc/systemd/system/dragonseye.service
```

```ini
[Unit]
Description=DragonsEye API
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/DragonsEye-RansomwareTracker
Environment="ENVIRONMENT=production"
Environment="ALLOWED_ORIGINS=https://dragons.community"
ExecStart=/var/www/DragonsEye-RansomwareTracker/venv/bin/python api/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable dragonseye
sudo systemctl start dragonseye
```

### Nginx + SSL

```bash
sudo certbot --nginx -d api.dragons.community
```

```nginx
server {
    listen 443 ssl http2;
    server_name api.dragons.community;

    ssl_certificate /etc/letsencrypt/live/api.dragons.community/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.dragons.community/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## ✅ Checklist

### Private Repo
- [ ] Frontend dahil
- [ ] Gerçek .env mevcut
- [ ] Vercel'e bağlı
- [ ] Auto-deploy aktif

### Public Repo
- [ ] Frontend HARİÇ
- [ ] .env YOK (sadece env.example)
- [ ] README CLI kullanımı açıklıyor
- [ ] LICENSE mevcut
- [ ] Hassas veri yok

### Production
- [ ] HTTPS aktif
- [ ] Admin şifresi değişti
- [ ] Rate limiting test edildi
- [ ] Backup sistemi kurulu

---

## 🔗 URL'ler

| Servis | URL |
|--------|-----|
| Frontend | https://dragons.community |
| API | https://api.dragons.community |
| API Docs | https://api.dragons.community/docs |
| GitHub Public | https://github.com/USER/DragonsEye-RansomwareTracker |
