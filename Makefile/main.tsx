# Makefile for MASUP.ID Docker Operations

.PHONY: help build up down logs clean restart dev prod deploy

# Colors for terminal output
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)

# Variables
PROJECT_NAME = masup-ticketing
DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_PROD = docker-compose -f docker-compose.prod.yml

help: ## Tampilkan help menu
	@echo '${GREEN}MASUP.ID Docker Commands:${RESET}'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  ${YELLOW}%-20s${RESET} %s\n", $$1, $$2}'
	@echo ''

# ============================================
# Development Commands
# ============================================

dev: ## Start development server with hot-reload
	@echo '${GREEN}Starting development server...${RESET}'
	$(DOCKER_COMPOSE) --profile dev up masup-dev

dev-build: ## Build development image
	@echo '${GREEN}Building development image...${RESET}'
	$(DOCKER_COMPOSE) build masup-dev

dev-logs: ## Show development logs
	$(DOCKER_COMPOSE) logs -f masup-dev

# ============================================
# Production Commands
# ============================================

build: ## Build production Docker image
	@echo '${GREEN}Building production image...${RESET}'
	$(DOCKER_COMPOSE) build

build-no-cache: ## Build production image without cache
	@echo '${GREEN}Building production image (no cache)...${RESET}'
	$(DOCKER_COMPOSE) build --no-cache

up: ## Start production container
	@echo '${GREEN}Starting production container...${RESET}'
	$(DOCKER_COMPOSE) up -d
	@echo '${GREEN}Application running at http://localhost:3000${RESET}'

down: ## Stop and remove containers
	@echo '${YELLOW}Stopping containers...${RESET}'
	$(DOCKER_COMPOSE) down

restart: ## Restart containers
	@echo '${YELLOW}Restarting containers...${RESET}'
	$(DOCKER_COMPOSE) restart

# ============================================
# Logs & Monitoring
# ============================================

logs: ## Show container logs
	$(DOCKER_COMPOSE) logs -f

logs-frontend: ## Show frontend logs only
	$(DOCKER_COMPOSE) logs -f masup-frontend

ps: ## Show running containers
	$(DOCKER_COMPOSE) ps

health: ## Check container health
	@docker inspect masup-ticketing-web --format='{{.State.Health.Status}}' 2>/dev/null || echo "Container not running"

# ============================================
# Shell Access
# ============================================

shell: ## Enter container shell
	docker exec -it masup-ticketing-web sh

shell-dev: ## Enter development container shell
	docker exec -it masup-ticketing-dev sh

# ============================================
# Full Production Stack
# ============================================

prod: ## Start full production stack
	@echo '${GREEN}Starting full production stack...${RESET}'
	$(DOCKER_COMPOSE_PROD) up -d
	@echo '${GREEN}Application running at http://localhost${RESET}'

prod-build: ## Build full production stack
	@echo '${GREEN}Building full production stack...${RESET}'
	$(DOCKER_COMPOSE_PROD) build

prod-down: ## Stop full production stack
	$(DOCKER_COMPOSE_PROD) down

prod-logs: ## Show production stack logs
	$(DOCKER_COMPOSE_PROD) logs -f

# ============================================
# Database Operations (untuk nanti)
# ============================================

# db-migrate: ## Run database migrations
# 	$(DOCKER_COMPOSE_PROD) exec backend php artisan migrate

# db-seed: ## Seed database
# 	$(DOCKER_COMPOSE_PROD) exec backend php artisan db:seed

# db-reset: ## Reset database
# 	$(DOCKER_COMPOSE_PROD) exec backend php artisan migrate:fresh --seed

# ============================================
# Cleanup Commands
# ============================================

clean: ## Remove containers and images
	@echo '${YELLOW}Cleaning up containers and images...${RESET}'
	$(DOCKER_COMPOSE) down -v
	docker system prune -f

clean-all: ## Remove everything (containers, images, volumes, networks)
	@echo '${YELLOW}Cleaning up everything...${RESET}'
	$(DOCKER_COMPOSE) down -v
	docker system prune -a --volumes -f

# ============================================
# Deployment Commands
# ============================================

deploy: build up ## Build and deploy to production
	@echo '${GREEN}Deployment complete!${RESET}'
	@make health

deploy-full: prod-build prod ## Build and deploy full stack
	@echo '${GREEN}Full stack deployment complete!${RESET}'

update: ## Pull latest code and redeploy
	@echo '${GREEN}Pulling latest code...${RESET}'
	git pull origin main
	@make deploy

rollback: ## Rollback to previous version
	@echo '${YELLOW}Rolling back to previous version...${RESET}'
	docker-compose down
	docker-compose up -d masup-frontend:previous

# ============================================
# Testing & Validation
# ============================================

test-health: ## Test health endpoint
	@curl -f http://localhost:3000/health && echo "\n${GREEN}✓ Health check passed${RESET}" || echo "\n${RED}✗ Health check failed${RESET}"

test-app: ## Test application is responding
	@curl -f http://localhost:3000 > /dev/null && echo "${GREEN}✓ Application is responding${RESET}" || echo "${RED}✗ Application is not responding${RESET}"

validate: build ## Validate Docker configuration
	@echo '${GREEN}Validating Docker configuration...${RESET}'
	$(DOCKER_COMPOSE) config

# ============================================
# Information Commands
# ============================================

info: ## Show container information
	@echo '${GREEN}Container Information:${RESET}'
	@echo 'Name: masup-ticketing-web'
	@docker inspect masup-ticketing-web --format='Status: {{.State.Status}}' 2>/dev/null || echo 'Status: Not running'
	@docker inspect masup-ticketing-web --format='Health: {{.State.Health.Status}}' 2>/dev/null || echo 'Health: N/A'
	@docker inspect masup-ticketing-web --format='IP Address: {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || echo 'IP Address: N/A'
	@echo ''
	@echo 'Ports:'
	@docker port masup-ticketing-web 2>/dev/null || echo 'No ports exposed'

stats: ## Show container resource usage
	docker stats --no-stream masup-ticketing-web

size: ## Show Docker image sizes
	@echo '${GREEN}Docker Image Sizes:${RESET}'
	@docker images | grep masup || echo 'No MASUP images found'

# ============================================
# Backup & Restore (untuk nanti)
# ============================================

# backup: ## Backup database and files
# 	@echo '${GREEN}Creating backup...${RESET}'
# 	@mkdir -p backups
# 	@docker exec masup-database-prod pg_dump -U masup_user masup_ticketing > backups/db-$(shell date +%Y%m%d-%H%M%S).sql
# 	@echo '${GREEN}Backup complete!${RESET}'

# restore: ## Restore from backup
# 	@echo '${YELLOW}Restoring from latest backup...${RESET}'
# 	@docker exec -i masup-database-prod psql -U masup_user masup_ticketing < $(shell ls -t backups/*.sql | head -1)
# 	@echo '${GREEN}Restore complete!${RESET}'

# ============================================
# Quick Commands
# ============================================

start: up ## Alias for 'up'
stop: down ## Alias for 'down'
rebuild: build-no-cache up ## Rebuild without cache and start

# Default target
.DEFAULT_GOAL := help
