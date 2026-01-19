# 🚀 KARTCIS.ID - Quick Deploy Cheat Sheet

## 📦 First Time Setup

```bash
# 1. SSH ke Hostinger VPS
ssh root@your-vps-ip

# 2. Clone repository
cd /var/www
git clone https://github.com/YOUR_USERNAME/kartcis-ticketing.git
cd kartcis-ticketing

# 3. Deploy
docker-compose build && docker-compose up -d

# ATAU pakai script otomatis
chmod +x deploy.sh
./deploy.sh first
```

---

## 🔄 Update Deployment (After Git Push)

```bash
cd /var/www/kartcis-ticketing
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# ATAU pakai script
./deploy.sh update

# ATAU pakai Makefile
make update
```

---

## ⚡ Quick Commands

### Docker Compose
```bash
docker-compose build              # Build image
docker-compose up -d              # Start (detached)
docker-compose down               # Stop & remove
docker-compose restart            # Restart
docker-compose logs -f            # Follow logs
docker-compose ps                 # List containers
```

### Makefile
```bash
make build          # Build production
make up             # Start
make down           # Stop
make restart        # Restart
make logs           # View logs
make health         # Check health
make deploy         # Build + deploy
make update         # Pull + rebuild
make clean          # Clean up
```

### Deploy Script
```bash
./deploy.sh first      # First deployment
./deploy.sh update     # Update after push
./deploy.sh quick      # Quick rebuild
./deploy.sh rollback   # Rollback version
./deploy.sh logs       # View logs
./deploy.sh status     # Check status
./deploy.sh cleanup    # Clean Docker
```

---

## 🔍 Monitoring

```bash
# Container status
docker ps | grep kartcis

# Logs
docker logs kartcis-ticketing-web -f

# Health check
curl http://localhost:3000/health

# Resource usage
docker stats kartcis-ticketing-web

# Container info
docker inspect kartcis-ticketing-web
```

---

## 🌐 Nginx Setup (One Time)

```bash
# Create config
nano /etc/nginx/sites-available/kartcis.id

# Enable site
ln -s /etc/nginx/sites-available/kartcis.id /etc/nginx/sites-enabled/

# Test config
nginx -t

# Reload nginx
systemctl reload nginx
```

**Minimal Config:**
```nginx
server {
    listen 80;
    server_name kartcis.id www.kartcis.id;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔒 SSL Setup (One Time)

```bash
# Install certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot --nginx -d kartcis.id -d www.kartcis.id

# Auto-renewal test
certbot renew --dry-run
```

---

## 🛠️ Troubleshooting

### Container won't start?
```bash
docker-compose logs
docker-compose down
docker system prune -f
docker-compose up -d
```

### Port already in use?
```bash
netstat -tulpn | grep 3000
kill -9 <PID>
```

### Build fails?
```bash
docker-compose build --no-cache --progress=plain
df -h  # Check disk space
docker system prune -a  # Clean cache
```

### Nginx error?
```bash
nginx -t
tail -f /var/log/nginx/error.log
systemctl restart nginx
```

---

## 📊 Workflow Lengkap

### Development → Production Flow

```bash
# 1. Local development
git add .
git commit -m "Update feature X"
git push origin main

# 2. SSH to server
ssh root@your-vps-ip

# 3. Deploy update
cd /var/www/kartcis-ticketing
./deploy.sh update

# 4. Verify
curl https://kartcis.id
```

---

## 🔥 Emergency Commands

```bash
# Quick restart
docker-compose restart

# Full restart
docker-compose down && docker-compose up -d

# Rollback
./deploy.sh rollback

# Force rebuild
docker-compose down
docker system prune -a -f
docker-compose build --no-cache
docker-compose up -d

# Check if site is up
curl -I https://kartcis.id
```

---

## 📞 Port Mapping

| Service | Container Port | Host Port |
|---------|---------------|-----------|
| Frontend | 80 | 3000 |
| Nginx | - | 80/443 |

---

## 📁 Important Paths

```bash
/var/www/kartcis-ticketing/          # Project root
/etc/nginx/sites-available/          # Nginx configs
/var/log/nginx/                      # Nginx logs
/var/backups/kartcis-*/              # Deployment backups
```

---

## 🎯 Daily Operations

### Check System
```bash
./deploy.sh status
```

### Update App
```bash
./deploy.sh update
```

### View Logs
```bash
./deploy.sh logs
```

### If Something Breaks
```bash
./deploy.sh rollback
```

---

## ✅ Success Indicators

```bash
# All should return OK:

docker ps | grep kartcis                    # Container running ✓
curl http://localhost:3000/health           # Health OK ✓
curl -I https://kartcis.id                  # HTTP 200 ✓
systemctl status nginx                      # Active ✓
```

---

## 💡 Pro Tips

1. **Always check logs after deploy:**
   ```bash
   docker-compose logs --tail=50
   ```

2. **Backup before risky changes:**
   ```bash
   docker save kartcis-ticketing:latest > backup.tar
   ```

3. **Monitor resource usage:**
   ```bash
   watch docker stats kartcis-ticketing-web
   ```

4. **Keep system updated:**
   ```bash
   apt update && apt upgrade -y
   ```

5. **Setup monitoring:**
   ```bash
   # Consider: Uptime Robot, Better Uptime, etc.
   ```

---

## 🆘 Get Help

```bash
./deploy.sh help
make help
docker-compose --help
```

---

**Last Updated**: January 19, 2026  
**Version**: 1.0.0  
**Status**: Production Ready 🚀
