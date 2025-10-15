# =============================================================================
# CryptoPulse Render Deployment Script - PowerShell Version
# =============================================================================
# Automated deployment script for Render.com platform

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$NC = "`e[0m" # No Color

# Configuration
$PROJECT_NAME = "cryptopulse"
$BACKEND_SERVICE_NAME = "cryptopulse-backend"
$FRONTEND_SERVICE_NAME = "cryptopulse-frontend"
$CLOUD_SERVICE_NAME = "cryptopulse-cloud"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "${Blue}[INFO]${NC} $Message"
}

function Write-Success {
    param([string]$Message)
    Write-Host "${Green}[SUCCESS]${NC} $Message"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "${Yellow}[WARNING]${NC} $Message"
}

function Write-Error {
    param([string]$Message)
    Write-Host "${Red}[ERROR]${NC} $Message"
}

# Function to create frontend service configuration
function Create-FrontendService {
    Write-Status "Creating frontend service configuration..."
    
    # Create render.yaml for frontend
    $renderYaml = @"
services:
  - type: static
    name: $FRONTEND_SERVICE_NAME
    buildCommand: npm install && npm run build:production
    staticPublishPath: dist
    envVars:
      - key: NODE_ENV
        value: production
      - key: VITE_API_BASE_URL
        value: https://cryptopulse-backend-j4ne.onrender.com
      - key: VITE_APP_NAME
        value: CryptoPulse
      - key: VITE_APP_VERSION
        value: 2.0.0
      - key: VITE_ENCRYPTION_KEY
        value: 351d82b45bcc2d9fc19fd9c46eea8006239c9ff578e7306abb6c970fd35ae919
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
"@
    
    # Write to frontend directory
    Set-Content -Path "frontend/render.yaml" -Value $renderYaml -Encoding UTF8
    
    Write-Success "Frontend service configuration created"
}

# Function to display deployment instructions
function Show-DeploymentInstructions {
    Write-Host ""
    Write-Host "🎉 ==============================================" -ForegroundColor Green
    Write-Host "   CryptoPulse Frontend Deployment Ready!" -ForegroundColor Green
    Write-Host "============================================== 🎉" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Manual Deployment Steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Go to https://dashboard.render.com" -ForegroundColor Cyan
    Write-Host "2. Click 'New +' → 'Static Site'" -ForegroundColor Cyan
    Write-Host "3. Connect your GitHub repository:" -ForegroundColor Cyan
    Write-Host "   - Repository: telangrocks/CryptoPulse-Trading-Bot" -ForegroundColor White
    Write-Host "   - Branch: main" -ForegroundColor White
    Write-Host "   - Root Directory: Cryptopulse--main/frontend" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Configure Build Settings:" -ForegroundColor Cyan
    Write-Host "   - Build Command: npm install && npm run build:production" -ForegroundColor White
    Write-Host "   - Publish Directory: dist" -ForegroundColor White
    Write-Host "   - Node Version: 20" -ForegroundColor White
    Write-Host ""
    Write-Host "5. Add Environment Variables:" -ForegroundColor Cyan
    Write-Host "   (Copy from frontend/render.yaml file)" -ForegroundColor White
    Write-Host ""
    Write-Host "6. Click 'Create Static Site'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📁 Configuration file created at: frontend/render.yaml" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Expected URL: https://cryptopulse-frontend.onrender.com" -ForegroundColor Yellow
    Write-Host ""
    Write-Success "Configuration ready for deployment! 🚀"
}

# Main execution
function Main {
    Write-Host "🚀 Starting CryptoPulse Frontend Configuration..." -ForegroundColor Green
    Write-Host ""
    
    try {
        # Create service configurations
        Create-FrontendService
        
        # Show deployment instructions
        Show-DeploymentInstructions
        
        Write-Success "Frontend service configuration completed successfully!"
        
    } catch {
        Write-Error "Failed to create frontend service configuration: $($_.Exception.Message)"
        exit 1
    }
}

# Run main function
Main
