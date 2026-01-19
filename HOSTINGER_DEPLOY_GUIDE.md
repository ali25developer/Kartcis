# 🚀 Hostinger VPS Deployment Guide - KARTCIS.ID

## 📋 Prerequisites di VPS Hostinger

Pastikan VPS Hostinger sudah terinstall:
- Docker
- Docker Compose
- Git

---

## 🔧 Step 1: Install Dependencies (Jika Belum Ada)

```bash
# SSH ke VPS Hostinger
ssh root@your-vps-ip

# Update sistem
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Install Git
apt install git -y

# Verify instalasi
docker --version
docker-compose --version
git --version
```

---

## 🚀 Step 2: Clone Repository

```bash
# Masuk ke direktori web (sesuaikan dengan setup Hostinger)
cd /var/www

# Clone repository (ganti dengan URL repo kamu)
git clone https://github.com/YOUR_USERNAME/kartcis-ticketing.git

# Atau jika pakai SSH
git clone git@github.com:YOUR_USERNAME/kartcis-ticketing.git

# Masuk ke folder project
cd kartcis-ticketing

# Check branch
git branch
git status
```

---

## 🏗️ Step 3: Build Production

### Option A: Using Docker Compose (Recommended)

```bash
# Build production image
docker-compose build

# Start containers
docker-compose up -d

# Check running containers
docker ps

# Check logs
docker-compose logs -f
```

### Option B: Using Makefile (Lebih Simple)

```bash
# Build
make build

# Start
make up

# Check health
make health

# Check logs
make logs
```

### Option C: Manual Docker Commands

```bash
# Build image
docker build -t kartcis-ticketing:latest .

# Run container
docker run -d \
  --name kartcis-ticketing-web \
  -p 3000:80 \
  --restart unless-stopped \
  kartcis-ticketing:latest

# Check status
docker ps | grep kartcis
```

---

## 🌐 Step 4: Configure Domain & Nginx Reverse Proxy

### Setup Nginx sebagai Reverse Proxy

```bash
# Install Nginx (jika belum)
apt install nginx -y

# Buat config untuk domain
nano /etc/nginx/sites-available/kartcis.id
```

**Isi file config:**

```nginx
server {
    listen 80;
    server_name kartcis.id www.kartcis.id;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

**Aktivasi config:**

```bash
# Buat symlink
ln -s /etc/nginx/sites-available/kartcis.id /etc/nginx/sites-enabled/

# Test config
nginx -t

# Reload nginx
systemctl reload nginx

# Enable nginx on boot
systemctl enable nginx
```

---

## 🔒 Step 5: Setup SSL dengan Certbot (HTTPS)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Generate SSL certificate
certbot --nginx -d kartcis.id -d www.kartcis.id

# Certbot akan otomatis update config nginx dengan HTTPS
# Certificate akan auto-renew

# Test auto-renewal
certbot renew --dry-run
```

---

## 🎯 Step 6: Verify Deployment

```bash
# Check container status
docker ps

# Check logs
docker logs kartcis-ticketing-web -f

# Test dari dalam server
curl http://localhost:3000/health

# Test dari browser
# https://kartcis.id
```

---

## 🔄 Update & Redeploy (Git Pull)

Untuk update aplikasi setelah ada perubahan di repository:

```bash
# Masuk ke folder project
cd /var/www/kartcis-ticketing

# Pull latest changes
git pull origin main

# Stop containers
docker-compose down

# Rebuild
docker-compose build

# Start lagi
docker-compose up -d

# Atau pakai Makefile
make update
```

### Quick Update Script

Buat file `update.sh`:

```bash
#!/bin/bash
# Quick update script for KARTCIS.ID

echo "🔄 Updating KARTCIS.ID..."

cd /var/www/kartcis-ticketing

echo "📥 Pulling latest code..."
git pull origin main

echo "🛑 Stopping containers..."
docker-compose down

echo "🏗️ Building new image..."
docker-compose build --no-cache

echo "🚀 Starting containers..."
docker-compose up -d

echo "✅ Update complete!"
echo "🔍 Checking status..."
docker ps | grep kartcis

echo "📊 Recent logs:"
docker-compose logs --tail=50
```

**Jalankan:**

```bash
chmod +x update.sh
./update.sh
```

---

## 🔥 Production Stack (Full dengan Database - Future)

Untuk production lengkap dengan database:

```bash
# Gunakan docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# Atau pakai Makefile
make prod
```

---

## 📊 Monitoring & Maintenance

### Check Container Health

```bash
# Status
docker ps

# Health check
docker inspect kartcis-ticketing-web --format='{{.State.Health.Status}}'

# Resource usage
docker stats kartcis-ticketing-web

# Logs
docker logs kartcis-ticketing-web -f --tail=100
```

### Makefile Commands (Cheat Sheet)

```bash
make help           # Lihat semua commands
make build          # Build production
make up             # Start production
make down           # Stop production
make restart        # Restart
make logs           # View logs
make shell          # Enter container
make clean          # Clean up
make deploy         # Build + deploy
make health         # Check health
make info           # Container info
```

### Clean Up (Jika Perlu)

```bash
# Stop semua
docker-compose down

# Remove images
docker rmi kartcis-ticketing:latest

# Clean all
make clean-all

# System prune
docker system prune -a --volumes -f
```

---

## 🛠️ Troubleshooting

### Port sudah digunakan?

```bash
# Check port 3000
netstat -tulpn | grep 3000

# Kill process jika perlu
kill -9 <PID>

# Atau ubah port di docker-compose.yml
```

### Container tidak start?

```bash
# Check logs
docker-compose logs

# Check Docker daemon
systemctl status docker

# Restart Docker
systemctl restart docker
```

### Build gagal?

```bash
# Build dengan verbose
docker-compose build --no-cache --progress=plain

# Check disk space
df -h

# Clean Docker cache
docker system prune -a
```

### Nginx error?

```bash
# Check config
nginx -t

# Check error logs
tail -f /var/log/nginx/error.log

# Restart nginx
systemctl restart nginx
```

---

## 🔐 Security Best Practices

```bash
# Setup firewall
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw enable

# Change SSH port (optional)
nano /etc/ssh/sshd_config
# Port 22 → Port 2222

# Disable root login
# PermitRootLogin no

# Setup fail2ban
apt install fail2ban -y
systemctl enable fail2ban

# Regular updates
apt update && apt upgrade -y
```

---

## 📝 Environment Variables (Untuk Nanti)

Jika butuh environment variables:

```bash
# Buat .env file
nano .env
```

**Isi .env:**

```env
# App Config
NODE_ENV=production
PORT=3000
APP_URL=https://kartcis.id

# Database (untuk nanti)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=kartcis_ticketing
# DB_USER=kartcis_user
# DB_PASSWORD=your_secure_password

# API Keys (untuk nanti)
# PAYMENT_API_KEY=your_payment_api_key
# EMAIL_API_KEY=your_email_api_key
```

**Update docker-compose.yml untuk load .env**

---

## 🎉 Complete Deployment Flow

### First Time Deploy:

```bash
# 1. SSH ke server
ssh root@your-hostinger-vps-ip

# 2. Clone repo
cd /var/www
git clone https://github.com/YOUR_USERNAME/kartcis-ticketing.git
cd kartcis-ticketing

# 3. Build & run
make build
make up

# 4. Setup nginx & SSL
# (ikuti Step 4 & 5 di atas)

# 5. Verify
curl https://kartcis.id
```

### Update Deploy:

```bash
# 1. SSH ke server
ssh root@your-hostinger-vps-ip

# 2. Navigate to project
cd /var/www/kartcis-ticketing

# 3. Pull & redeploy
git pull origin main
make rebuild

# 4. Check
make health
make logs
```

---

## 📞 Quick Reference

| Command | Description |
|---------|-------------|
| `git clone <repo-url>` | Clone repository |
| `docker-compose build` | Build image |
| `docker-compose up -d` | Start containers |
| `docker-compose down` | Stop containers |
| `docker-compose logs -f` | View logs |
| `docker ps` | List containers |
| `make deploy` | Build + deploy |
| `make update` | Pull + rebuild |
| `nginx -t` | Test nginx config |
| `certbot --nginx -d domain.com` | Setup SSL |

---

## ✅ Deployment Checklist

- [ ] VPS ready with Docker installed
- [ ] Repository cloned
- [ ] Docker image built successfully
- [ ] Container running (`docker ps`)
- [ ] Nginx configured as reverse proxy
- [ ] SSL certificate installed
- [ ] Domain pointing to VPS IP
- [ ] Firewall configured
- [ ] Health check passing
- [ ] Website accessible via domain
- [ ] Update script created

---

**Deploy Date**: January 19, 2026  
**Server**: Hostinger VPS  
**Status**: Production Ready 🚀
