# =============================================================================
# CryptoPulse Deployment Cleanup Script - PowerShell
# Removes corrupted node_modules and cleans up deployment artifacts
# =============================================================================

$ErrorActionPreference = "Continue"

# Colors
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Get project root
$ProjectRoot = (Get-Item $PSScriptRoot).Parent.FullName
Set-Location $ProjectRoot

Write-Info "Starting CryptoPulse deployment cleanup..."
Write-Host ""

# Function to safely remove directory
function Remove-SafeDirectory {
    param([string]$Path)
    
    if (Test-Path $Path) {
        Write-Info "Removing $Path..."
        Remove-Item -Path $Path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Success "Removed $Path"
    } else {
        Write-Info "Skipping $Path (not found)"
    }
}

# Remove node_modules from all workspaces
Write-Info "Step 1: Removing node_modules directories..."
Remove-SafeDirectory "Cryptopulse--main\node_modules"
Remove-SafeDirectory "Cryptopulse--main\frontend\node_modules"
Remove-SafeDirectory "Cryptopulse--main\backend\node_modules"
Remove-SafeDirectory "Cryptopulse--main\cloud\node_modules"
Remove-SafeDirectory "node_modules"

# Remove pnpm store
Write-Info "Step 2: Cleaning pnpm store..."
try {
    Set-Location "Cryptopulse--main"
    $pnpmExists = Get-Command pnpm -ErrorAction SilentlyContinue
    if ($pnpmExists) {
        pnpm store prune
        Write-Success "Pnpm store cleaned"
    } else {
        Write-Warning "pnpm not found, skipping store cleanup"
    }
    Set-Location $ProjectRoot
} catch {
    Write-Warning "Failed to clean pnpm store: $($_.Exception.Message)"
    Set-Location $ProjectRoot
}

# Remove build artifacts
Write-Info "Step 3: Removing build artifacts..."
Remove-SafeDirectory "Cryptopulse--main\frontend\dist"
Remove-SafeDirectory "Cryptopulse--main\backend\dist"
Remove-SafeDirectory "Cryptopulse--main\cloud\dist"
Remove-SafeDirectory "dist"

# Remove caches
Write-Info "Step 4: Removing cache directories..."
Remove-SafeDirectory "Cryptopulse--main\.cache"
Remove-SafeDirectory "Cryptopulse--main\frontend\.cache"
Remove-SafeDirectory "Cryptopulse--main\backend\.cache"
Remove-SafeDirectory "Cryptopulse--main\cloud\.cache"

# Remove any tar archives
Write-Info "Step 5: Removing tar archives..."
Get-ChildItem -Path $ProjectRoot -Recurse -Include "*.tar", "*.tar.gz", "*.tgz" -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -notmatch "node_modules" } | 
    ForEach-Object {
        Write-Info "Found archive: $($_.FullName)"
        Remove-Item $_.FullName -Force
        Write-Success "Removed: $($_.Name)"
    }

# Remove log files
Write-Info "Step 6: Removing log files..."
Get-ChildItem -Path $ProjectRoot -Recurse -Filter "*.log" -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -notmatch "node_modules" } | 
    Remove-Item -Force -ErrorAction SilentlyContinue
Write-Success "Log files removed"

# Remove temp files
Write-Info "Step 7: Removing temporary files..."
Get-ChildItem -Path $ProjectRoot -Recurse -Include "*.tmp", "*.temp", "*.bak" -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -notmatch "node_modules" } | 
    Remove-Item -Force -ErrorAction SilentlyContinue
Write-Success "Temporary files removed"

# Remove old deployment backups
Write-Info "Step 8: Cleaning old deployment backups..."
if (Test-Path ".deployment-backups") {
    $OldDate = (Get-Date).AddDays(-7)
    Get-ChildItem ".deployment-backups" -Directory -Filter "build-*" | 
        Where-Object { $_.LastWriteTime -lt $OldDate } | 
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Success "Old backups cleaned"
}

Write-Host ""
Write-Success "✨ Cleanup completed successfully!"
Write-Host ""
Write-Info "Next steps:"
Write-Info "  1. Run: cd Cryptopulse--main; pnpm install"
Write-Info "  2. Run: cd Cryptopulse--main\frontend; pnpm install"
Write-Info "  3. Verify build: cd Cryptopulse--main\frontend; pnpm build"
Write-Host ""

