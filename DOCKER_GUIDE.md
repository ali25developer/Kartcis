# 🐳 Docker Setup Guide - MASUP.ID

## 📋 Overview

Sistem MASUP.ID sudah dilengkapi dengan Docker configuration untuk deployment yang mudah dan konsisten di berbagai environment.

## 📁 File Docker yang Tersedia

```
/
├── Dockerfile                 # Production build dengan Nginx
├── Dockerfile.dev             # Development build dengan hot-reload
├── docker-compose.yml         # Development & Production setup
├── docker-compose.prod.yml    # Full production stack (frontend, backend, db)
├── nginx.conf                 # Nginx configuration untuk serving React SPA
└── .dockerignore              # Files yang diabaikan saat build
```

## 🚀 Quick Start

### 1. Production Build & Run

```bash
# Build dan jalankan production container
docker-compose up -d

# Akses aplikasi di:
# http://localhost:3000
```

### 2. Development Mode

```bash
# Jalankan dalam development mode dengan hot-reload
docker-compose --profile dev up masup-dev

# Akses aplikasi di:
# http://localhost:5173
```

### 3. Production dengan Full Stack

```bash
# Jalankan full production stack
docker-compose -f docker-compose.prod.yml up -d

# Akses aplikasi di:
# http://localhost (port 80)
```

## 🛠️ Available Commands

### Build Commands

```bash
# Build production image
docker-compose build

# Build tanpa cache (fresh build)
docker-compose build --no-cache

# Build development image
docker-compose build masup-dev
```

### Run Commands

```bash
# Start semua services
docker-compose up -d

# Start specific service
docker-compose up -d masup-frontend

# Start dengan logs
docker-compose up

# Stop services
docker-compose down

# Stop dan remove volumes
docker-compose down -v
```

### Logs & Debugging

```bash
# Lihat logs
docker-compose logs -f

# Lihat logs specific service
docker-compose logs -f masup-frontend

# Enter container bash
docker exec -it masup-ticketing-web sh

# Check container status
docker-compose ps

# Check container health
docker inspect masup-ticketing-web --format='{{.State.Health.Status}}'
```

### Maintenance Commands

```bash
# Restart services
docker-compose restart

# Rebuild dan restart
docker-compose up -d --build

# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Clean all (containers, images, volumes, networks)
docker system prune -a --volumes
```

## 📦 Docker Images

### Production Image
- **Base**: `nginx:alpine` (lightweight)
- **Size**: ~50MB (optimized)
- **Includes**: Built React app + Nginx server
- **Port**: 80

### Development Image
- **Base**: `node:20-alpine`
- **Size**: ~200MB
- **Includes**: Node.js + dev dependencies
- **Port**: 5173 (Vite dev server)

## 🔧 Configuration Details

### Dockerfile (Production)

**Stage 1 - Builder:**
- Install dependencies dengan `npm ci`
- Build React app dengan `npm run build`
- Output ke `/app/dist`

**Stage 2 - Production:**
- Copy built files ke Nginx
- Custom Nginx config untuk SPA routing
- Gzip compression enabled
- Security headers added
- Health check endpoint: `/health`

### nginx.conf Features

```nginx
✅ Gzip compression untuk assets
✅ Cache control headers
✅ Security headers (XSS, Frame, Content-Type)
✅ SPA fallback routing (React Router support)
✅ Health check endpoint
✅ Static asset caching (1 year)
✅ Custom error pages
```

### Environment Variables

Tambahkan file `.env` untuk configuration:

```bash
# .env
NODE_ENV=production
VITE_API_URL=https://api.masup.id
VITE_APP_VERSION=1.0.0
```

## 🌐 Production Deployment

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone <repo-url>
cd masup-ticketing

# 2. Build production image
docker-compose build

# 3. Run container
docker-compose up -d

# 4. Verify
curl http://localhost:3000/health
```

### Option 2: Standalone Docker

```bash
# Build image
docker build -t masup-frontend:latest .

# Run container
docker run -d \
  --name masup-web \
  -p 3000:80 \
  --restart unless-stopped \
  masup-frontend:latest

# Verify
docker ps
curl http://localhost:3000
```

### Option 3: Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml masup

# Check services
docker stack services masup

# Scale frontend
docker service scale masup_frontend=3
```

### Option 4: Kubernetes (Advanced)

```bash
# Build dan push ke registry
docker build -t your-registry/masup-frontend:v1.0.0 .
docker push your-registry/masup-frontend:v1.0.0

# Apply Kubernetes manifests
kubectl apply -f k8s/
```

## 🔒 Security Best Practices

### 1. Non-Root User (Optional Enhancement)

Update Dockerfile untuk run as non-root:

```dockerfile
# Add to Dockerfile stage 2
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx
USER nginx
```

### 2. SSL/TLS Support

Update nginx.conf untuk HTTPS:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... rest of config
}
```

### 3. Environment Secrets

Jangan commit `.env` file! Gunakan Docker secrets:

```bash
# Create secret
echo "secret_value" | docker secret create db_password -

# Use in docker-compose.yml
secrets:
  - db_password
```

## 📊 Monitoring & Health Checks

### Built-in Health Check

```bash
# Check health status
docker inspect masup-ticketing-web | grep -A 5 Health

# Test health endpoint
curl http://localhost:3000/health
```

### Add External Monitoring

```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

## 🚦 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker image
        run: docker build -t masup-frontend:latest .
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push masup-frontend:latest
      
      - name: Deploy to server
        run: |
          ssh user@server 'cd /app && docker-compose pull && docker-compose up -d'
```

## 🐛 Troubleshooting

### Container tidak start

```bash
# Check logs
docker-compose logs masup-frontend

# Check container details
docker inspect masup-ticketing-web
```

### Build error

```bash
# Clean build cache
docker builder prune -a

# Rebuild tanpa cache
docker-compose build --no-cache
```

### Port sudah digunakan

```bash
# Check port usage
lsof -i :3000

# Kill process
kill -9 <PID>

# Atau ubah port di docker-compose.yml
ports:
  - "8080:80"  # Ganti 3000 ke 8080
```

### Hot reload tidak jalan (dev mode)

```bash
# Pastikan volume mapping benar
volumes:
  - .:/app
  - /app/node_modules  # Important!

# Restart container
docker-compose restart masup-dev
```

## 📈 Performance Optimization

### 1. Multi-stage Build
✅ Already implemented - reduces final image size by 80%

### 2. Layer Caching
```dockerfile
# Copy package.json first (better caching)
COPY package*.json ./
RUN npm ci
COPY . .  # This layer only rebuilds when code changes
```

### 3. Nginx Optimization
✅ Gzip compression enabled
✅ Static asset caching
✅ HTTP/2 ready

## 🔄 Update Strategy

### Zero-Downtime Deployment

```bash
# 1. Build new version
docker-compose build

# 2. Start new container
docker-compose up -d --no-deps --build masup-frontend

# Old container automatically replaced
```

### Rollback

```bash
# Quick rollback to previous version
docker-compose down
docker-compose up -d masup-frontend:previous

# Or use specific image tag
docker run -d -p 3000:80 masup-frontend:v1.0.0
```

## 📝 File Sizes

```
Production Image:    ~50 MB (nginx + app)
Development Image:   ~200 MB (node + deps)
node_modules:        ~300 MB (excluded via .dockerignore)
Build output (dist): ~2 MB (gzipped)
```

## ✅ Production Checklist

- [ ] Build production image successfully
- [ ] Test health endpoint `/health`
- [ ] Verify SPA routing works
- [ ] Check static assets caching
- [ ] Test on different browsers
- [ ] Setup SSL/TLS certificates
- [ ] Configure environment variables
- [ ] Setup logging & monitoring
- [ ] Configure auto-restart policy
- [ ] Setup backup strategy
- [ ] Document deployment process

## 🆘 Support

Jika ada masalah:
1. Check logs: `docker-compose logs -f`
2. Check health: `curl http://localhost:3000/health`
3. Restart: `docker-compose restart`
4. Rebuild: `docker-compose up -d --build`

---

**Last Updated**: January 2026
**Docker Version**: 24.x
**Docker Compose Version**: 2.x
