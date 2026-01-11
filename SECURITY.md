# 🛡️ DragonsEye RansomwareTracker - Security Guide

## ⚠️ Production Security Checklist

Before deploying to production, complete these security steps:

### 1. Environment Configuration

Create a `.env` file in the project root with these variables:

```bash
# Environment
ENVIRONMENT=production

# Admin credentials (CHANGE THESE!)
# Generate hash: python -c "import hashlib; print(hashlib.sha256('YourSecurePassword123!'.encode()).hexdigest())"
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD_HASH=your_sha256_password_hash

# CORS - Your actual domains only
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Port
PORT=8000
```

### 2. Admin Password Setup

Generate a secure password hash:

```bash
python -c "import hashlib; print(hashlib.sha256('YourSecurePassword123!'.encode()).hexdigest())"
```

Use the output as `ADMIN_PASSWORD_HASH` in your environment.

### 3. HTTPS Configuration

Always use HTTPS in production. Configure a reverse proxy (nginx, Caddy, etc.):

**nginx example:**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Firewall Configuration

Only expose necessary ports:

```bash
# UFW example
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 5. Database Security

- Keep `db/` directory outside web root
- Regular backups: `cp -r db/ backups/db_$(date +%Y%m%d)/`
- File permissions: `chmod 600 db/*.json`

---

## 🔒 Security Features Implemented

### API Security

| Feature | Status | Description |
|---------|--------|-------------|
| Rate Limiting | ✅ | 100 requests/minute per IP |
| CORS | ✅ | Configurable origins |
| Security Headers | ✅ | X-Frame-Options, X-XSS-Protection, etc. |
| Admin Auth | ✅ | HTTP Basic with SHA256 password hash |
| Input Validation | ✅ | Pydantic models for API input |

### Frontend Security

| Feature | Status | Description |
|---------|--------|-------------|
| XSS Prevention | ✅ | HTML sanitization, no dangerouslySetInnerHTML |
| CSRF Protection | ✅ | Same-origin policy enforced |
| Secure Cookies | ⚠️ | Enable in production with HTTPS |

---

## 🚨 Known Limitations

1. **Session Storage**: Admin credentials are stored in browser sessionStorage. For high-security environments, consider implementing JWT tokens.

2. **Rate Limiting**: Current implementation is in-memory. For multi-instance deployments, use Redis.

3. **Log Files**: Ensure log rotation is configured to prevent disk space issues.

---

## 📧 Security Contact

Report security vulnerabilities to: **support@dragons.community**

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

We will respond within 48 hours.

---

## 🔄 Security Updates

| Date | Update |
|------|--------|
| 2026-01-11 | Added rate limiting, security headers, backend authentication |
| 2026-01-11 | Removed hardcoded credentials from frontend |
| 2026-01-11 | Fixed XSS vulnerability in group descriptions |

