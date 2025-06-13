# CopilotKit Runtime Server - Development Commands

.PHONY: help build up dev down logs clean install test

# Default target
help: ## Show this help message
	@echo "CopilotKit Runtime Server - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Docker Compose Commands
build: ## Build the Docker images
	docker-compose build

up: ## Start services in production mode
	docker-compose up -d

dev: ## Start services in development mode with hot reload
	docker-compose -f docker-compose.dev.yml up --build

dev-bg: ## Start development services in background
	docker-compose -f docker-compose.dev.yml up -d --build

down: ## Stop all services
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

logs: ## Show logs from all services
	docker-compose logs -f

logs-dev: ## Show logs from development services
	docker-compose -f docker-compose.dev.yml logs -f

clean: ## Remove containers, networks, and images
	docker-compose down -v --rmi all
	docker-compose -f docker-compose.dev.yml down -v --rmi all

# Local Development Commands
install: ## Install dependencies locally
	npm install

test: ## Run type checking
	npm run type-check

build-local: ## Build TypeScript locally
	npm run build

dev-local: ## Run development server locally
	npm run dev

start-local: ## Start production server locally
	npm start

# Environment Setup
env: ## Create .env file from example (if it doesn't exist)
	@if [ ! -f .env ]; then \
		echo "Creating .env file from env.example..."; \
		cp env.example .env; \
		echo "Please edit .env file with your API keys"; \
	else \
		echo ".env file already exists"; \
	fi

# Health Check Commands
health: ## Check service health
	@curl -s http://localhost:3000/health | jq '.' || echo "Service not running or jq not installed"

providers: ## Check configured providers
	@curl -s http://localhost:3000/api/providers | jq '.' || echo "Service not running or jq not installed"

# Quick Start
quick-start: env dev ## Quick start: create .env and run development server

# Production Deploy
deploy: build up ## Build and deploy in production mode

# Status Commands
status: ## Show container status
	docker-compose ps
	docker-compose -f docker-compose.dev.yml ps 