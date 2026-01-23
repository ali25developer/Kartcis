#!/bin/bash

# Deploy Script for Hostinger VPS
# Usage: ./deploy.sh [user@vps-ip]

VPS_TARGET=$1

if [ -z "$VPS_TARGET" ]; then
  echo "Usage: ./deploy.sh user@vps-ip"
  echo "Example: ./deploy.sh root@123.456.78.90"
  exit 1
fi

echo "Deploying to $VPS_TARGET..."

# 1. Build locally to check errors (optional, comment out if not needed)
# npm run build

# 2. Copy files to VPS
echo "Copying files..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' . $VPS_TARGET:~/app

# 3. Remote commands
echo "Executing remote commands..."
ssh $VPS_TARGET << 'EOF'
  cd ~/app
  
  # Ensure docker is running
  if ! command -v docker &> /dev/null; then
      echo "Docker not found. Installing..."
      curl -fsSL https://get.docker.com -o get-docker.sh
      sh get-docker.sh
  fi

  # Build and start container
  echo "Building and starting containers..."
  docker-compose -f docker-compose.prod.yml up -d --build

  # Prune unused images
  docker image prune -f

  echo "Deployment complete!"
  docker-compose -f docker-compose.prod.yml ps
EOF
