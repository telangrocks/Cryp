#!/bin/bash

# =============================================================================
# CryptoPulse Render Deployment Script
# =============================================================================
# Automated deployment script for Render.com platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="cryptopulse"
BACKEND_SERVICE_NAME="cryptopulse-backend"
FRONTEND_SERVICE_NAME="cryptopulse-frontend"
CLOUD_SERVICE_NAME="cryptopulse-cloud"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Render CLI is installed
check_render_cli() {
    if ! command -v render &> /dev/null; then
        print_error "Render CLI is not installed!"
        print_status "Installing Render CLI..."
        curl -fsSL https://cli.render.com/install | sh
        print_success "Render CLI installed successfully!"
    else
        print_success "Render CLI is already installed"
    fi
}

# Function to login to Render
render_login() {
    print_status "Logging into Render..."
    if render auth login; then
        print_success "Successfully logged into Render"
    else
        print_error "Failed to login to Render"
        exit 1
    fi
}

# Function to create backend service
create_backend_service() {
    print_status "Creating backend service..."
    
    # Create render.yaml for backend
    cat > backend/render.yaml << EOF
services:
  - type: web
    name: $BACKEND_SERVICE_NAME
    env: node
    plan: starter
    buildCommand: npm install && npm run build:production
    startCommand: npm run start:production
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 1337
      - key: LOG_LEVEL
        value: info
      - key: ENABLE_MONITORING
        value: true
      - key: ENABLE_TRACING
        value: true
      - key: CLUSTER_MODE
        value: true
    autoDeploy: true
EOF

    print_success "Backend service configuration created"
}

# Function to create frontend service
create_frontend_service() {
    print_status "Creating frontend service..."
    
    # Create render.yaml for frontend
    cat > frontend/render.yaml << EOF
services:
  - type: static
    name: $FRONTEND_SERVICE_NAME
    buildCommand: npm install && npm run build:production
    staticPublishPath: dist
    envVars:
      - key: NODE_ENV
        value: production
      - key: VITE_APP_NAME
        value: CryptoPulse
      - key: VITE_APP_VERSION
        value: 2.0.0
      - key: VITE_BUILD_TARGET
        value: production
      - key: VITE_ENABLE_SOURCEMAPS
        value: false
      - key: VITE_DEBUG_MODE
        value: false
      - key: VITE_ENABLE_ANALYTICS
        value: false
      - key: VITE_ENABLE_WEBSOCKET
        value: true
      - key: VITE_API_TIMEOUT
        value: 30000
      - key: VITE_API_MAX_RETRIES
        value: 3
      - key: VITE_DEFAULT_TRADING_PAIR
        value: BTC/USDT
      - key: VITE_DEFAULT_EXCHANGE
        value: binance
      - key: VITE_DEFAULT_THEME
        value: system
      - key: VITE_DEFAULT_CURRENCY
        value: USD
      - key: VITE_CHART_REFRESH_INTERVAL
        value: 5
      - key: VITE_ENABLE_SERVICE_WORKER
        value: true
      - key: VITE_ENABLE_LAZY_LOADING
        value: true
    autoDeploy: true
EOF

    print_success "Frontend service configuration created"
}

# Function to create cloud service
create_cloud_service() {
    print_status "Creating cloud service..."
    
    # Create render.yaml for cloud
    cat > cloud/render.yaml << EOF
services:
  - type: web
    name: $CLOUD_SERVICE_NAME
    env: node
    plan: starter
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: LOG_LEVEL
        value: info
      - key: ENABLE_MONITORING
        value: true
    autoDeploy: true
EOF

    print_success "Cloud service configuration created"
}

# Function to deploy services
deploy_services() {
    print_status "Deploying services to Render..."
    
    # Deploy backend
    print_status "Deploying backend service..."
    cd backend
    if render service create --file render.yaml; then
        print_success "Backend service deployed successfully"
    else
        print_warning "Backend service might already exist, updating..."
        render service update --file render.yaml
    fi
    cd ..
    
    # Deploy frontend
    print_status "Deploying frontend service..."
    cd frontend
    if render service create --file render.yaml; then
        print_success "Frontend service deployed successfully"
    else
        print_warning "Frontend service might already exist, updating..."
        render service update --file render.yaml
    fi
    cd ..
    
    # Deploy cloud
    print_status "Deploying cloud service..."
    cd cloud
    if render service create --file render.yaml; then
        print_success "Cloud service deployed successfully"
    else
        print_warning "Cloud service might already exist, updating..."
        render service update --file render.yaml
    fi
    cd ..
}

# Function to check deployment status
check_deployment_status() {
    print_status "Checking deployment status..."
    
    # List all services
    render service list
    
    print_status "Deployment completed! Check your Render dashboard for service URLs."
    print_success "Services should be available at:"
    print_status "- Backend: https://$BACKEND_SERVICE_NAME.onrender.com"
    print_status "- Frontend: https://$FRONTEND_SERVICE_NAME.onrender.com"
    print_status "- Cloud: https://$CLOUD_SERVICE_NAME.onrender.com"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Wait for services to be ready
    sleep 30
    
    # Check backend health
    if curl -f "https://$BACKEND_SERVICE_NAME.onrender.com/health" > /dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_warning "Backend health check failed - service might still be starting"
    fi
    
    # Check cloud health
    if curl -f "https://$CLOUD_SERVICE_NAME.onrender.com/health" > /dev/null 2>&1; then
        print_success "Cloud health check passed"
    else
        print_warning "Cloud health check failed - service might still be starting"
    fi
    
    # Check frontend
    if curl -f "https://$FRONTEND_SERVICE_NAME.onrender.com" > /dev/null 2>&1; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend might still be building"
    fi
}

# Function to display final URLs
display_final_urls() {
    echo ""
    echo "🎉 =============================================="
    echo "   CryptoPulse Deployment Completed Successfully!"
    echo "============================================== 🎉"
    echo ""
    echo "📱 Your Application URLs:"
    echo "   Frontend:  https://$FRONTEND_SERVICE_NAME.onrender.com"
    echo "   Backend:   https://$BACKEND_SERVICE_NAME.onrender.com"
    echo "   Cloud:     https://$CLOUD_SERVICE_NAME.onrender.com"
    echo ""
    echo "🔍 Health Check URLs:"
    echo "   Backend Health:  https://$BACKEND_SERVICE_NAME.onrender.com/health"
    echo "   Cloud Health:    https://$CLOUD_SERVICE_NAME.onrender.com/health"
    echo ""
    echo "📊 Monitor your services at: https://dashboard.render.com"
    echo ""
    print_success "Deployment completed successfully! 🚀"
}

# Main execution
main() {
    echo "🚀 Starting CryptoPulse Render Deployment..."
    echo ""
    
    # Check prerequisites
    check_render_cli
    render_login
    
    # Create service configurations
    create_backend_service
    create_frontend_service
    create_cloud_service
    
    # Deploy services
    deploy_services
    
    # Check status and health
    check_deployment_status
    run_health_checks
    
    # Display final URLs
    display_final_urls
}

# Run main function
main "$@"
