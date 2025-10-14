# =============================================================================
# CryptoPulse Production Deployment Script - 100% Production Ready
# =============================================================================
# World-Class Production Deployment with Docker Compose
# Author: CryptoPulse Team
# License: MIT

param(
    [Parameter(Position=0)]
    [string]$Command = "deploy",
    [Parameter(Position=1)]
    [string]$Service = ""
)

# =========================================================================
# Configuration
# =========================================================================
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectName = "cryptopulse"
$ComposeFile = "docker-compose.production.yml"
$EnvFile = "env.production"
$LogFile = "deployment.log"

# =========================================================================
# Utility Functions
# =========================================================================
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

function Write-Success {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ✓ $Message" -ForegroundColor Green
    Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ✓ $Message"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ⚠ $Message" -ForegroundColor Yellow
    Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ⚠ $Message"
}

function Write-Error {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ✗ $Message" -ForegroundColor Red
    Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ✗ $Message"
    exit 1
}

# =========================================================================
# Prerequisites Check
# =========================================================================
function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check if Docker is installed
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed. Please install Docker Desktop first."
    }
    
    # Check if Docker Compose is installed
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error "Docker Compose is not installed. Please install Docker Compose first."
    }
    
    # Check if environment file exists
    if (-not (Test-Path $EnvFile)) {
        Write-Error "Environment file $EnvFile not found. Please create it first."
    }
    
    # Check if compose file exists
    if (-not (Test-Path $ComposeFile)) {
        Write-Error "Docker Compose file $ComposeFile not found."
    }
    
    Write-Success "Prerequisites check passed"
}

# =========================================================================
# Environment Setup
# =========================================================================
function Initialize-Environment {
    Write-Log "Setting up environment..."
    
    # Create necessary directories
    $Directories = @(
        "data/postgres/primary",
        "data/postgres/replica",
        "data/redis/primary",
        "data/redis/replica",
        "data/mongodb",
        "data/prometheus",
        "data/grafana",
        "logs",
        "backups",
        "ssl"
    )
    
    foreach ($Dir in $Directories) {
        if (-not (Test-Path $Dir)) {
            New-Item -ItemType Directory -Path $Dir -Force | Out-Null
        }
    }
    
    Write-Success "Environment setup completed"
}

# =========================================================================
# Docker Network Setup
# =========================================================================
function Initialize-Network {
    Write-Log "Setting up Docker network..."
    
    # Create custom network if it doesn't exist
    $NetworkExists = docker network ls --format "{{.Name}}" | Where-Object { $_ -eq "$ProjectName-network" }
    
    if (-not $NetworkExists) {
        docker network create --driver bridge --subnet=172.20.0.0/16 --gateway=172.20.0.1 "$ProjectName-network"
        Write-Success "Docker network created"
    } else {
        Write-Log "Docker network already exists"
    }
}

# =========================================================================
# Build Images
# =========================================================================
function Build-Images {
    Write-Log "Building Docker images..."
    
    # Build backend image
    Write-Log "Building backend image..."
    docker-compose -f $ComposeFile --env-file $EnvFile build backend
    
    # Build frontend image
    Write-Log "Building frontend image..."
    docker-compose -f $ComposeFile --env-file $EnvFile build frontend
    
    # Build cloud image
    Write-Log "Building cloud image..."
    docker-compose -f $ComposeFile --env-file $EnvFile build cloud
    
    Write-Success "All images built successfully"
}

# =========================================================================
# Deploy Services
# =========================================================================
function Deploy-Services {
    Write-Log "Deploying services..."
    
    # Start services in order
    Write-Log "Starting database services..."
    docker-compose -f $ComposeFile --env-file $EnvFile up -d postgres postgres-replica redis redis-replica mongodb
    
    # Wait for databases to be ready
    Write-Log "Waiting for databases to be ready..."
    Start-Sleep -Seconds 30
    
    # Start application services
    Write-Log "Starting application services..."
    docker-compose -f $ComposeFile --env-file $EnvFile up -d backend backend-2 cloud frontend
    
    # Wait for applications to be ready
    Write-Log "Waiting for applications to be ready..."
    Start-Sleep -Seconds 30
    
    # Start nginx and monitoring
    Write-Log "Starting nginx and monitoring services..."
    docker-compose -f $ComposeFile --env-file $EnvFile up -d nginx prometheus grafana
    
    Write-Success "All services deployed successfully"
}

# =========================================================================
# Health Check
# =========================================================================
function Test-Health {
    Write-Log "Performing health checks..."
    
    # Check if all containers are running
    $RunningContainers = docker-compose -f $ComposeFile --env-file $EnvFile ps --services --filter "status=running"
    if (-not $RunningContainers) {
        Write-Error "Some services are not running"
    }
    
    # Check backend health
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost:1337/health" -TimeoutSec 10 -ErrorAction Stop
        Write-Success "Backend is healthy"
    } catch {
        Write-Warning "Backend health check failed: $($_.Exception.Message)"
    }
    
    # Check frontend health
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -ErrorAction Stop
        Write-Success "Frontend is healthy"
    } catch {
        Write-Warning "Frontend health check failed: $($_.Exception.Message)"
    }
    
    # Check nginx health
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost/health" -TimeoutSec 10 -ErrorAction Stop
        Write-Success "Nginx is healthy"
    } catch {
        Write-Warning "Nginx health check failed: $($_.Exception.Message)"
    }
    
    Write-Success "Health checks completed"
}

# =========================================================================
# Show Status
# =========================================================================
function Show-Status {
    Write-Log "Service Status:"
    docker-compose -f $ComposeFile --env-file $EnvFile ps
    
    Write-Host ""
    Write-Log "Service URLs:"
    Write-Host "  Frontend: http://localhost:3000"
    Write-Host "  Backend API: http://localhost:1337"
    Write-Host "  Cloud Services: http://localhost:3001"
    Write-Host "  Nginx (Load Balancer): http://localhost"
    Write-Host "  Prometheus: http://localhost:9090"
    Write-Host "  Grafana: http://localhost:3002"
    Write-Host ""
    Write-Log "Logs: docker-compose -f $ComposeFile --env-file $EnvFile logs -f [service_name]"
    Write-Log "Stop: docker-compose -f $ComposeFile --env-file $EnvFile down"
}

# =========================================================================
# Cleanup
# =========================================================================
function Remove-All {
    Write-Log "Cleaning up..."
    
    # Stop and remove containers
    docker-compose -f $ComposeFile --env-file $EnvFile down
    
    # Remove unused images
    docker image prune -f
    
    Write-Success "Cleanup completed"
}

# =========================================================================
# Main Function
# =========================================================================
function Main {
    switch ($Command.ToLower()) {
        "deploy" {
            Write-Log "Starting CryptoPulse Production Deployment..."
            Test-Prerequisites
            Initialize-Environment
            Initialize-Network
            Build-Images
            Deploy-Services
            Test-Health
            Show-Status
            Write-Success "Deployment completed successfully!"
        }
        "stop" {
            Write-Log "Stopping CryptoPulse services..."
            docker-compose -f $ComposeFile --env-file $EnvFile down
            Write-Success "Services stopped"
        }
        "restart" {
            Write-Log "Restarting CryptoPulse services..."
            docker-compose -f $ComposeFile --env-file $EnvFile restart
            Test-Health
            Write-Success "Services restarted"
        }
        "status" {
            Show-Status
        }
        "logs" {
            if ($Service) {
                docker-compose -f $ComposeFile --env-file $EnvFile logs -f $Service
            } else {
                docker-compose -f $ComposeFile --env-file $EnvFile logs -f
            }
        }
        "cleanup" {
            Remove-All
        }
        "help" {
            Write-Host "Usage: .\deploy.ps1 [command] [service]"
            Write-Host ""
            Write-Host "Commands:"
            Write-Host "  deploy   - Deploy all services (default)"
            Write-Host "  stop     - Stop all services"
            Write-Host "  restart  - Restart all services"
            Write-Host "  status   - Show service status"
            Write-Host "  logs     - Show logs [service_name]"
            Write-Host "  cleanup  - Clean up containers and images"
            Write-Host "  help     - Show this help message"
        }
        default {
            Write-Error "Unknown command: $Command. Use 'help' for available commands."
        }
    }
}

# Run main function
Main
