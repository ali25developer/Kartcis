# 🐳 MASUP.ID - Docker Quick Start

> Panduan cepat untuk menjalankan MASUP.ID menggunakan Docker

## 🚀 Quick Start (3 Langkah)

```bash
# 1. Clone repository
git clone <repository-url>
cd masup-ticketing

# 2. Build Docker image
make build

# 3. Run aplikasi
make up

# ✅ Akses di: http://localhost:3000
```

## 📦 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.x
- Make (optional, untuk shortcut commands)

## 🎯 Available Make Commands

Gunakan `make` untuk mempermudah Docker operations:

```bash
make help              # Tampilkan semua commands
make dev               # Development mode (hot-reload)
make build             # Build production image
make up                # Start production container
make down              # Stop container
make logs              # Show logs
make restart           # Restart container
make clean             # Cleanup containers & images
```

## 🔧 Manual Commands (Tanpa Make)

### Production

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f
```

### Development

```bash
# Start dev server with hot-reload
docker-compose --profile dev up masup-dev

# Access at: http://localhost:5173
```

## 📊 Container Details

| Container | Port | Size | Description |
|-----------|------|------|-------------|
| masup-ticketing-web | 3000 → 80 | ~50MB | Production (Nginx + React) |
| masup-ticketing-dev | 5173 | ~200MB | Development (Vite hot-reload) |

## 🌐 Access Points

- **Production**: http://localhost:3000
- **Development**: http://localhost:5173
- **Health Check**: http://localhost:3000/health

## 📝 Environment Variables

Copy `.env.example` ke `.env` dan sesuaikan:

```bash
cp .env.example .env
nano .env
```

## 🔍 Troubleshooting

### Container tidak start?
```bash
make logs              # Check error logs
make clean             # Clean and rebuild
make build
make up
```

### Port sudah digunakan?
Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Ganti dari 3000 ke 8080
```

### Need to rebuild?
```bash
make rebuild           # Rebuild without cache
```

## 📚 Full Documentation

Lihat [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) untuk dokumentasi lengkap.

## 🎉 Success!

Jika semua berjalan lancar, Anda akan melihat:

```
✅ Application running at http://localhost:3000
✅ Health check: healthy
✅ Status: Up
```

Test dengan:
```bash
make test-health       # Test health endpoint
make test-app          # Test aplikasi berjalan
```

---

**Happy Coding!** 🚀
