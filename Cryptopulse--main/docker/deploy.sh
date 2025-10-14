#!/bin/bash

# =============================================================================
# CryptoPulse Production Deployment Script - 100% Production Ready
# =============================================================================
# World-Class Production Deployment with Docker Compose
# Author: CryptoPulse Team
# License: MIT

set -euo pipefail

# =========================================================================
# Configuration
# =========================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="cryptopulse"
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE="env.production"
LOG_FILE="deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =========================================================================
# Utility Functions
# =========================================================================
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

# =========================================================================
# Prerequisites Check
# =========================================================================
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if environment file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        error "Environment file $ENV_FILE not found. Please create it first."
    fi
    
    # Check if compose file exists
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        error "Docker Compose file $COMPOSE_FILE not found."
    fi
    
    success "Prerequisites check passed"
}

# =========================================================================
# Environment Setup
# =========================================================================
setup_environment() {
    log "Setting up environment..."
    
    # Create necessary directories
    mkdir -p data/postgres/primary
    mkdir -p data/postgres/replica
    mkdir -p data/redis/primary
    mkdir -p data/redis/replica
    mkdir -p data/mongodb
    mkdir -p data/prometheus
    mkdir -p data/grafana
    mkdir -p logs
    mkdir -p backups
    mkdir -p ssl
    
    # Set proper permissions
    chmod 755 data/
    chmod 755 logs/
    chmod 755 backups/
    
    success "Environment setup completed"
}

# =========================================================================
# Docker Network Setup
# =========================================================================
setup_network() {
    log "Setting up Docker network..."
    
    # Create custom network if it doesn't exist
    if ! docker network ls | grep -q "$PROJECT_NAME-network"; then
        docker network create \
            --driver bridge \
            --subnet=172.20.0.0/16 \
            --gateway=172.20.0.1 \
            "$PROJECT_NAME-network"
        success "Docker network created"
    else
        log "Docker network already exists"
    fi
}

# =========================================================================
# Build Images
# =========================================================================
build_images() {
    log "Building Docker images..."
    
    # Build backend image
    log "Building backend image..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build backend
    
    # Build frontend image
    log "Building frontend image..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build frontend
    
    # Build cloud image
    log "Building cloud image..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build cloud
    
    success "All images built successfully"
}

# =========================================================================
# Deploy Services
# =========================================================================
deploy_services() {
    log "Deploying services..."
    
    # Start services in order
    log "Starting database services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres postgres-replica redis redis-replica mongodb
    
    # Wait for databases to be ready
    log "Waiting for databases to be ready..."
    sleep 30
    
    # Start application services
    log "Starting application services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d backend backend-2 cloud frontend
    
    # Wait for applications to be ready
    log "Waiting for applications to be ready..."
    sleep 30
    
    # Start nginx and monitoring
    log "Starting nginx and monitoring services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d nginx prometheus grafana
    
    success "All services deployed successfully"
}

# =========================================================================
# Health Check
# =========================================================================
health_check() {
    log "Performing health checks..."
    
    # Check if all containers are running
    if ! docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps | grep -q "Up"; then
        error "Some services are not running"
    fi
    
    # Check backend health
    if ! curl -f http://localhost:1337/health &> /dev/null; then
        warning "Backend health check failed"
    else
        success "Backend is healthy"
    fi
    
    # Check frontend health
    if ! curl -f http://localhost:3000 &> /dev/null; then
        warning "Frontend health check failed"
    else
        success "Frontend is healthy"
    fi
    
    # Check nginx health
    if ! curl -f http://localhost/health &> /dev/null; then
        warning "Nginx health check failed"
    else
        success "Nginx is healthy"
    fi
    
    success "Health checks completed"
}

# =========================================================================
# Show Status
# =========================================================================
show_status() {
    log "Service Status:"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    
    echo ""
    log "Service URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:1337"
    echo "  Cloud Services: http://localhost:3001"
    echo "  Nginx (Load Balancer): http://localhost"
    echo "  Prometheus: http://localhost:9090"
    echo "  Grafana: http://localhost:3002"
    echo ""
    log "Logs: docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f [service_name]"
    log "Stop: docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE down"
}

# =========================================================================
# Cleanup
# =========================================================================
cleanup() {
    log "Cleaning up..."
    
    # Stop and remove containers
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    
    # Remove unused images
    docker image prune -f
    
    success "Cleanup completed"
}

# =========================================================================
# Main Function
# =========================================================================
main() {
    case "${1:-deploy}" in
        "deploy")
            log "Starting CryptoPulse Production Deployment..."
            check_prerequisites
            setup_environment
            setup_network
            build_images
            deploy_services
            health_check
            show_status
            success "Deployment completed successfully!"
            ;;
        "stop")
            log "Stopping CryptoPulse services..."
            docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
            success "Services stopped"
            ;;
        "restart")
            log "Restarting CryptoPulse services..."
            docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart
            health_check
            success "Services restarted"
            ;;
        "status")
            show_status
            ;;
        "logs")
            docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f "${2:-}"
            ;;
        "cleanup")
            cleanup
            ;;
        "help")
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  deploy   - Deploy all services (default)"
            echo "  stop     - Stop all services"
            echo "  restart  - Restart all services"
            echo "  status   - Show service status"
            echo "  logs     - Show logs [service_name]"
            echo "  cleanup  - Clean up containers and images"
            echo "  help     - Show this help message"
            ;;
        *)
            error "Unknown command: $1. Use 'help' for available commands."
            ;;
    esac
}

# Run main function with all arguments
main "$@"
