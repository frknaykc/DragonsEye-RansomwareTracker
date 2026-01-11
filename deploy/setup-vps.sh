#!/bin/bash
# =============================================================================
# 🐉 DragonsEye RansomwareTracker - VPS Setup Script
# =============================================================================
# Bu scripti VPS'te çalıştır: bash setup-vps.sh
# =============================================================================

set -e

echo "🐉 DragonsEye VPS Kurulumu Başlıyor..."
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# =============================================================================
# 1. SYSTEM UPDATE
# =============================================================================
echo -e "${YELLOW}[1/8] Sistem güncelleniyor...${NC}"
apt update && apt upgrade -y

# =============================================================================
# 2. INSTALL DEPENDENCIES
# =============================================================================
echo -e "${YELLOW}[2/8] Bağımlılıklar kuruluyor...${NC}"
apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    tor \
    curl \
    wget \
    htop \
    unzip

# =============================================================================
# 3. CONFIGURE TOR
# =============================================================================
echo -e "${YELLOW}[3/8] Tor yapılandırılıyor...${NC}"
systemctl enable tor
systemctl start tor

# Test Tor
sleep 3
if curl --socks5-hostname 127.0.0.1:9050 -s https://check.torproject.org/api/ip | grep -q "true"; then
    echo -e "${GREEN}✅ Tor çalışıyor!${NC}"
else
    echo -e "${RED}⚠️ Tor bağlantısı kontrol edilmeli${NC}"
fi

# =============================================================================
# 4. CLONE PROJECT
# =============================================================================
echo -e "${YELLOW}[4/8] Proje klonlanıyor...${NC}"
cd /var/www
rm -rf DragonsEye-RansomwareTracker 2>/dev/null || true
git clone https://github.com/frknaykc/DragonsEye-RansomwareTracker.git
cd DragonsEye-RansomwareTracker

# =============================================================================
# 5. SETUP PYTHON ENVIRONMENT
# =============================================================================
echo -e "${YELLOW}[5/8] Python ortamı kuruluyor...${NC}"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Install Playwright browsers
pip install playwright
playwright install firefox
playwright install-deps firefox

# =============================================================================
# 6. CREATE ENVIRONMENT FILE
# =============================================================================
echo -e "${YELLOW}[6/8] Environment dosyası oluşturuluyor...${NC}"
cat > .env << 'EOF'
# DragonsEye Production Environment
ENVIRONMENT=production
PORT=8000

# Admin credentials (CHANGE THESE!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=CHANGE_THIS_HASH

# CORS - Add your frontend domain
ALLOWED_ORIGINS=https://dragons.community,https://www.dragons.community

# Tor Proxy
TOR_PROXY=socks5h://127.0.0.1:9050
EOF

echo -e "${RED}⚠️ .env dosyasını düzenlemeyi unutma!${NC}"

# =============================================================================
# 7. CREATE SYSTEMD SERVICE
# =============================================================================
echo -e "${YELLOW}[7/8] Systemd servisi oluşturuluyor...${NC}"
cat > /etc/systemd/system/dragonseye.service << 'EOF'
[Unit]
Description=DragonsEye RansomwareTracker API
After=network.target tor.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/DragonsEye-RansomwareTracker
Environment="PATH=/var/www/DragonsEye-RansomwareTracker/venv/bin"
EnvironmentFile=/var/www/DragonsEye-RansomwareTracker/.env
ExecStart=/var/www/DragonsEye-RansomwareTracker/venv/bin/python api/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
chown -R www-data:www-data /var/www/DragonsEye-RansomwareTracker

# Enable and start service
systemctl daemon-reload
systemctl enable dragonseye
systemctl start dragonseye

# =============================================================================
# 8. CONFIGURE NGINX
# =============================================================================
echo -e "${YELLOW}[8/8] Nginx yapılandırılıyor...${NC}"
cat > /etc/nginx/sites-available/dragonseye << 'EOF'
server {
    listen 80;
    server_name api.dragons.community;  # CHANGE THIS TO YOUR DOMAIN

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files (images)
    location /images/ {
        alias /var/www/DragonsEye-RansomwareTracker/images/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/dragonseye /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t && systemctl reload nginx

# =============================================================================
# DONE!
# =============================================================================
echo ""
echo -e "${GREEN}=============================================="
echo "🐉 KURULUM TAMAMLANDI!"
echo "=============================================="
echo ""
echo "📋 Sonraki adımlar:"
echo ""
echo "1. .env dosyasını düzenle:"
echo "   nano /var/www/DragonsEye-RansomwareTracker/.env"
echo ""
echo "2. Nginx'te domain'i değiştir:"
echo "   nano /etc/nginx/sites-available/dragonseye"
echo ""
echo "3. SSL sertifikası al:"
echo "   certbot --nginx -d api.YOUR_DOMAIN.com"
echo ""
echo "4. Servisi yeniden başlat:"
echo "   systemctl restart dragonseye"
echo ""
echo "5. Durumu kontrol et:"
echo "   systemctl status dragonseye"
echo "   curl http://localhost:8000/health"
echo ""
echo -e "=============================================="${NC}

