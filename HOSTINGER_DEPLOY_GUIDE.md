# Hostinger VPS Deployment Guide (Docker)

This guide explains how to deploy the KARTCIS application to a Hostinger VPS using Docker and Docker Compose.

## Prerequisites

1.  **Hostinger VPS** with **Docker** template installed (or Ubuntu/Debian with Docker installed manually).
2.  **SSH Access** to your VPS.
3.  **Domain Name** pointed to your VPS IP address (A Record).

## 1. Prepare Your VPS

Connect to your VPS via SSH:

```bash
ssh root@your_vps_ip
```

Ensure Docker and Docker Compose are installed:

```bash
docker --version
docker-compose --version
```

If not installed, update and install:

```bash
apt update && apt upgrade -y
apt install docker.io docker-compose -y
systemctl enable --now docker
```

## 2. Deploy Code

You have two options: **Git Clone** (Recommended) or **Manual Upload**.

### Option A: Git Clone (Recommended)

1.  Generate an SSH key on your VPS (if you haven't already) and add it to your GitHub/GitLab:
    ```bash
    ssh-keygen -t ed25519 -C "vps-deploy"
    cat ~/.ssh/id_ed25519.pub
    ```
2.  Clone the repository:
    ```bash
    git clone <your-repo-url> app
    cd app
    ```

### Option B: Manual Upload (SCP)

From your **local machine**:

```bash
# Upload all files (excluding node_modules)
scp -r . root@your_vps_ip:/root/app
```

Then on VPS: `cd /root/app`

## 3. Configure Environment

Create a `.env` file for production variables if needed (though this frontend might not need many secrets if they are baked in at build time, but run-time vars go here).

```bash
cp .env.example .env
# Edit .env
nano .env
```

## 4. Run with Docker Compose

We use `docker-compose.prod.yml` for production.

```bash
# Build and start in detached mode
docker-compose -f docker-compose.prod.yml up -d --build
```

Check the status:

```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

## 5. Setup SSL (HTTPS)

For a simple setup, we can use **Certbot** directly on the host or use a reverse proxy like **Traefik** or **Nginx Proxy Manager**.

### Option A: Quick Nginx inside Docker (Current Setup)

Your `docker-compose.prod.yml` exposes port 80 and 443.
You need to mount SSL certificates if you want HTTPS directly on the container.

1.  **Get Certs** (install certbot on host):
    ```bash
    apt install certbot -y
    certbot certonly --standalone -d kartcis.id
    ```
2.  **Mount Certs**:
    Modify `docker-compose.prod.yml` to map the certs:
    ```yaml
    volumes:
      - /etc/letsencrypt/live/kartcis.id/fullchain.pem:/etc/nginx/ssl/server.crt:ro
      - /etc/letsencrypt/live/kartcis.id/privkey.pem:/etc/nginx/ssl/server.key:ro
    ```
    (You will need to update `nginx.conf` to listen on 443 and use these keys).

### Option B: Reverse Proxy on Host (Recommended)

Run Nginx on the VPS host (outside Docker) to handle SSL, then proxy to Docker port 80.

1.  Install Nginx on host: `apt install nginx`
2.  Use Certbot: `certbot --nginx -d kartcis.id`
3.  Edit Nginx config to proxy to `localhost:80` (or whatever port you bind the container to).

## 6. Updates

To update the app:

```bash
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate
```
