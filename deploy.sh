#!/bin/bash
# KARTCIS.ID - Quick Deploy Script for Hostinger VPS
# Usage: ./deploy.sh [command]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Config
PROJECT_DIR="/var/www/kartcis-ticketing"
BRANCH="main"

# Functions
function print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

function print_error() {
    echo -e "${RED}✗ $1${NC}"
}

function print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

function print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

function check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker tidak terinstall!"
        exit 1
    fi
    print_success "Docker found"
}

function check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose tidak terinstall!"
        exit 1
    fi
    print_success "Docker Compose found"
}

function first_deploy() {
    print_info "🚀 First Time Deployment..."
    
    # Check dependencies
    check_docker
    check_docker_compose
    
    # Clone repository
    print_info "📥 Cloning repository..."
    cd /var/www
    
    if [ -d "$PROJECT_DIR" ]; then
        print_warning "Directory already exists. Use 'update' instead."
        exit 1
    fi
    
    read -p "Enter repository URL: " REPO_URL
    git clone "$REPO_URL" kartcis-ticketing
    
    cd "$PROJECT_DIR"
    
    # Build and deploy
    print_info "🏗️ Building Docker image..."
    docker-compose build
    
    print_info "🚀 Starting containers..."
    docker-compose up -d
    
    print_success "Deployment complete!"
    print_info "📊 Container status:"
    docker ps | grep kartcis
    
    echo ""
    print_info "Next steps:"
    echo "  1. Configure Nginx reverse proxy"
    echo "  2. Setup SSL with Certbot"
    echo "  3. Point domain to this server"
}

function update_deploy() {
    print_info "🔄 Updating deployment..."
    
    if [ ! -d "$PROJECT_DIR" ]; then
        print_error "Project directory not found. Use 'first' for first deployment."
        exit 1
    fi
    
    cd "$PROJECT_DIR"
    
    # Backup current version
    print_info "💾 Creating backup..."
    BACKUP_DIR="/var/backups/kartcis-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    docker-compose down
    docker save kartcis-ticketing:latest > "$BACKUP_DIR/image.tar" || print_warning "No image to backup"
    print_success "Backup created at $BACKUP_DIR"
    
    # Pull latest code
    print_info "📥 Pulling latest code from $BRANCH..."
    git fetch origin
    git pull origin "$BRANCH"
    
    # Rebuild
    print_info "🏗️ Rebuilding image..."
    docker-compose build --no-cache
    
    # Start
    print_info "🚀 Starting containers..."
    docker-compose up -d
    
    # Wait for health check
    print_info "⏳ Waiting for containers to be healthy..."
    sleep 5
    
    # Check status
    if docker ps | grep -q kartcis-ticketing-web; then
        print_success "Update complete! ✨"
        print_info "📊 Container status:"
        docker ps | grep kartcis
        
        echo ""
        print_info "📋 Recent logs:"
        docker-compose logs --tail=20
    else
        print_error "Deployment failed! Rolling back..."
        docker load < "$BACKUP_DIR/image.tar"
        docker-compose up -d
        print_warning "Rolled back to previous version"
        exit 1
    fi
}

function quick_deploy() {
    print_info "⚡ Quick deploy (no cache)..."
    
    cd "$PROJECT_DIR" || exit 1
    
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    print_success "Quick deploy complete!"
    docker ps | grep kartcis
}

function rollback() {
    print_info "↩️ Rolling back to previous version..."
    
    LATEST_BACKUP=$(ls -t /var/backups/kartcis-* | head -1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        print_error "No backup found!"
        exit 1
    fi
    
    print_info "Found backup: $LATEST_BACKUP"
    
    cd "$PROJECT_DIR" || exit 1
    docker-compose down
    docker load < "$LATEST_BACKUP/image.tar"
    docker-compose up -d
    
    print_success "Rollback complete!"
}

function show_logs() {
    print_info "📋 Showing logs..."
    cd "$PROJECT_DIR" || exit 1
    docker-compose logs -f --tail=50
}

function show_status() {
    print_info "📊 Status KARTCIS.ID:"
    
    echo ""
    echo "🐳 Docker Containers:"
    docker ps | grep kartcis || echo "No containers running"
    
    echo ""
    echo "💾 Disk Usage:"
    df -h | grep -E "Filesystem|/$"
    
    echo ""
    echo "📈 Container Stats:"
    docker stats --no-stream kartcis-ticketing-web 2>/dev/null || echo "Container not running"
    
    echo ""
    echo "🔍 Health Check:"
    curl -s http://localhost:3000/health && print_success "Healthy" || print_error "Unhealthy"
}

function cleanup() {
    print_warning "🧹 Cleaning up Docker resources..."
    
    read -p "This will remove all stopped containers and unused images. Continue? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker system prune -a --volumes -f
        print_success "Cleanup complete!"
    else
        print_info "Cleanup cancelled"
    fi
}

function show_help() {
    echo "KARTCIS.ID Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  first       First time deployment (clone + build + deploy)"
    echo "  update      Update deployment (pull + rebuild + deploy)"
    echo "  quick       Quick deploy (rebuild without cache)"
    echo "  rollback    Rollback to previous version"
    echo "  logs        Show container logs"
    echo "  status      Show deployment status"
    echo "  cleanup     Clean up Docker resources"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh first      # First deployment"
    echo "  ./deploy.sh update     # Update after git push"
    echo "  ./deploy.sh logs       # View logs"
}

# Main
case "${1:-help}" in
    first)
        first_deploy
        ;;
    update)
        update_deploy
        ;;
    quick)
        quick_deploy
        ;;
    rollback)
        rollback
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    cleanup)
        cleanup
        ;;
    help|*)
        show_help
        ;;
esac
