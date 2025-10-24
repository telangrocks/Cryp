#!/usr/bin/env bash
################################################################################
# CryptoPulse Deployment Cleanup Script
# Removes corrupted node_modules and cleans up deployment artifacts
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

log_info "Starting CryptoPulse deployment cleanup..."
echo ""

# Function to safely remove directory
safe_remove() {
    local dir=$1
    if [[ -d "${dir}" ]]; then
        log_info "Removing ${dir}..."
        rm -rf "${dir}"
        log_success "Removed ${dir}"
    else
        log_info "Skipping ${dir} (not found)"
    fi
}

# Remove node_modules from all workspaces
log_info "Step 1: Removing node_modules directories..."
safe_remove "Cryptopulse--main/node_modules"
safe_remove "Cryptopulse--main/frontend/node_modules"
safe_remove "Cryptopulse--main/backend/node_modules"
safe_remove "Cryptopulse--main/cloud/node_modules"
safe_remove "node_modules"

# Remove pnpm store
log_info "Step 2: Cleaning pnpm store..."
if command -v pnpm &> /dev/null; then
    cd Cryptopulse--main
    pnpm store prune || log_warning "Failed to prune pnpm store"
    cd ..
    log_success "Pnpm store cleaned"
else
    log_warning "pnpm not found, skipping store cleanup"
fi

# Remove build artifacts
log_info "Step 3: Removing build artifacts..."
safe_remove "Cryptopulse--main/frontend/dist"
safe_remove "Cryptopulse--main/backend/dist"
safe_remove "Cryptopulse--main/cloud/dist"
safe_remove "dist"

# Remove caches
log_info "Step 4: Removing cache directories..."
safe_remove "Cryptopulse--main/.cache"
safe_remove "Cryptopulse--main/frontend/.cache"
safe_remove "Cryptopulse--main/backend/.cache"
safe_remove "Cryptopulse--main/cloud/.cache"

# Remove any tar archives
log_info "Step 5: Removing tar archives..."
find "${PROJECT_ROOT}" -name "*.tar" -o -name "*.tar.gz" -o -name "*.tgz" | while read -r file; do
    if [[ ! "$file" =~ node_modules ]]; then
        log_info "Found archive: $file"
        rm -f "$file"
        log_success "Removed: $file"
    fi
done

# Remove log files
log_info "Step 6: Removing log files..."
find "${PROJECT_ROOT}" -name "*.log" -not -path "*/node_modules/*" -delete || true
log_success "Log files removed"

# Remove temp files
log_info "Step 7: Removing temporary files..."
find "${PROJECT_ROOT}" -name "*.tmp" -o -name "*.temp" -o -name "*.bak" | \
    grep -v node_modules | \
    xargs rm -f || true
log_success "Temporary files removed"

# Remove deployment backups older than 7 days
log_info "Step 8: Cleaning old deployment backups..."
if [[ -d ".deployment-backups" ]]; then
    find .deployment-backups -type d -name "build-*" -mtime +7 -exec rm -rf {} + || true
    log_success "Old backups cleaned"
fi

echo ""
log_success "✨ Cleanup completed successfully!"
echo ""
log_info "Next steps:"
log_info "  1. Run: cd Cryptopulse--main && pnpm install"
log_info "  2. Run: cd Cryptopulse--main/frontend && pnpm install"
log_info "  3. Verify build: cd Cryptopulse--main/frontend && pnpm build"
echo ""

