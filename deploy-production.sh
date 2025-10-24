#!/usr/bin/env bash
################################################################################
# Production Deployment Script v2.0
# Security-hardened, enterprise-grade deployment automation
# 
# Features:
# - Comprehensive validation & error handling
# - Automatic backups & rollback capability
# - Security audit enforcement
# - Detailed logging & reporting
# - Environment safety checks
################################################################################

set -euo pipefail  # Exit on error, undefined vars, pipe failures
IFS=$'\n\t'        # Safer word splitting

################################################################################
# CONFIGURATION
################################################################################

# Paths (with validation)
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly BUILD_DIR="${PROJECT_ROOT}/dist"
readonly BACKUP_DIR="${PROJECT_ROOT}/.deployment-backups"
readonly LOG_DIR="${PROJECT_ROOT}/.deployment-logs"
readonly LOG_FILE="${LOG_DIR}/deploy-$(date +%Y%m%d-%H%M%S).log"

# Configuration (environment variables with defaults)
readonly PREVIEW_PORT="${PREVIEW_PORT:-4173}"
readonly MAX_BUNDLE_SIZE_MB="${MAX_BUNDLE_SIZE_MB:-10}"
readonly LARGE_FILE_THRESHOLD_KB="${LARGE_FILE_THRESHOLD_KB:-500}"
readonly REQUIRED_NODE_MAJOR="${REQUIRED_NODE_MAJOR:-18}"
readonly MAX_WAIT_TIME="${MAX_WAIT_TIME:-30}"
readonly DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"

# Git configuration
readonly MAIN_BRANCH="${MAIN_BRANCH:-main}"
readonly ALLOWED_BRANCHES=("main" "master" "production")

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color
readonly BOLD='\033[1m'

################################################################################
# LOGGING FUNCTIONS
################################################################################

init_logging() {
    mkdir -p "${LOG_DIR}"
    touch "${LOG_FILE}"
    
    # Keep only last 10 logs
    find "${LOG_DIR}" -name "deploy-*.log" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true
}

log() {
    local timestamp
    timestamp="$(date +'%Y-%m-%d %H:%M:%S')"
    echo "[${timestamp}] $*" | tee -a "${LOG_FILE}"
}

log_raw() {
    echo "$*" | tee -a "${LOG_FILE}"
}

log_section() {
    log_raw ""
    log_raw "================================================================================"
    log_raw "$(echo -e "${CYAN}${BOLD}🚀 $*${NC}")"
    log_raw "================================================================================"
}

log_success() {
    log "$(echo -e "${GREEN}✅ $*${NC}")"
}

log_warning() {
    log "$(echo -e "${YELLOW}⚠️  $*${NC}")"
}

log_error() {
    log "$(echo -e "${RED}❌ $*${NC}")"
}

log_info() {
    log "$(echo -e "${BLUE}ℹ️  $*${NC}")"
}

################################################################################
# ERROR HANDLING
################################################################################

declare -g PREVIEW_PID=""
declare -g CLEANUP_PERFORMED=false

cleanup_on_exit() {
    local exit_code=$?
    
    # Prevent duplicate cleanup
    if [[ "${CLEANUP_PERFORMED}" == "true" ]]; then
        return
    fi
    CLEANUP_PERFORMED=true
    
    log_raw ""
    
    if [[ ${exit_code} -ne 0 ]]; then
        log_error "Deployment failed with exit code: ${exit_code}"
        log_warning "Check full log at: ${LOG_FILE}"
        
        # Kill preview server if running
        if [[ -n "${PREVIEW_PID}" ]] && ps -p "${PREVIEW_PID}" > /dev/null 2>&1; then
            log_info "Stopping preview server (PID: ${PREVIEW_PID})"
            kill "${PREVIEW_PID}" 2>/dev/null || true
            wait "${PREVIEW_PID}" 2>/dev/null || true
        fi
        
        # Show rollback information
        if [[ -L "${BACKUP_DIR}/last-successful" ]]; then
            log_raw ""
            log_warning "Rollback available! To restore previous build:"
            log_info "  cp -r ${BACKUP_DIR}/last-successful ${BUILD_DIR}"
        fi
        
        log_raw ""
        log_error "🛑 Deployment aborted"
    else
        log_raw ""
        log_success "🎉 Deployment preparation completed successfully!"
    fi
    
    log_raw ""
}

trap cleanup_on_exit EXIT SIGINT SIGTERM

################################################################################
# VALIDATION FUNCTIONS
################################################################################

validate_command() {
    local cmd=$1
    if ! command -v "${cmd}" &> /dev/null; then
        log_error "${cmd} is not installed or not in PATH"
        return 1
    fi
    return 0
}

validate_environment() {
    log_section "Phase 1: Environment Validation"
    
    # Check required commands (FIXED: Added pnpm)
    local required_commands=("node" "pnpm" "git" "curl" "find" "du")
    for cmd in "${required_commands[@]}"; do
        if validate_command "${cmd}"; then
            log_success "${cmd} found"
        else
            if [[ "${cmd}" == "pnpm" ]]; then
                log_error "pnpm is required but not found"
                log_info "Install with: npm install -g pnpm"
            fi
            exit 1
        fi
    done
    
    # Validate Node.js version
    local node_version node_major
    node_version=$(node -v)
    node_major=$(echo "${node_version}" | cut -d'.' -f1 | sed 's/v//')
    
    if [[ ${node_major} -lt ${REQUIRED_NODE_MAJOR} ]]; then
        log_error "Node.js version ${node_version} is too old (required: >= ${REQUIRED_NODE_MAJOR})"
        exit 1
    fi
    log_success "Node.js ${node_version} (meets requirement)"
    
    # Validate pnpm
    log_success "pnpm $(pnpm -v)"
    
    # Check project structure (FIXED: Check for pnpm-lock.yaml)
    local required_files=("package.json" "pnpm-lock.yaml")
    for file in "${required_files[@]}"; do
        if [[ ! -f "${PROJECT_ROOT}/${file}" ]]; then
            log_error "Required file missing: ${file}"
            exit 1
        fi
    done
    log_success "Project structure validated"
    
    # Validate git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
    log_success "Git repository detected"
    
    # Check current branch
    local current_branch
    current_branch=$(git branch --show-current)
    local branch_allowed=false
    
    for allowed in "${ALLOWED_BRANCHES[@]}"; do
        if [[ "${current_branch}" == "${allowed}" ]]; then
            branch_allowed=true
            break
        fi
    done
    
    if [[ "${branch_allowed}" == "false" ]]; then
        log_error "Current branch '${current_branch}' not allowed for deployment"
        log_info "Allowed branches: ${ALLOWED_BRANCHES[*]}"
        exit 1
    fi
    log_success "Branch '${current_branch}' is allowed"
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        log_warning "Uncommitted changes detected"
        git status --short | head -10 | tee -a "${LOG_FILE}"
        
        read -p "$(echo -e "${YELLOW}Continue with uncommitted changes? (y/N):${NC} ")" -n 1 -r
        log_raw ""
        if [[ ! ${REPLY} =~ ^[Yy]$ ]]; then
            log_error "Deployment cancelled by user"
            exit 1
        fi
    else
        log_success "Working directory clean"
    fi
    
    # Validate environment variables (if .env files exist)
    if [[ -f "${PROJECT_ROOT}/.env.production" ]]; then
        log_success ".env.production found"
    else
        log_warning ".env.production not found (optional)"
    fi
    
    log_success "Environment validation complete"
}

validate_dependencies() {
    log_section "Phase 2: Dependency Validation"
    
    # Check package.json integrity
    if ! node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
        log_error "package.json is malformed"
        exit 1
    fi
    log_success "package.json is valid JSON"
    
    # Check for known vulnerable packages (basic check)
    if grep -q "\"event-stream\": \"3.3.6\"" package.json 2>/dev/null; then
        log_error "Known malicious package detected: event-stream@3.3.6"
        exit 1
    fi
    
    log_success "No known malicious packages detected"
}

################################################################################
# BACKUP FUNCTIONS
################################################################################

create_backup() {
    log_section "Phase 3: Backup Creation"
    
    mkdir -p "${BACKUP_DIR}"
    
    if [[ -d "${BUILD_DIR}" ]]; then
        local backup_name="build-$(date +%Y%m%d-%H%M%S)"
        local backup_path="${BACKUP_DIR}/${backup_name}"
        
        log_info "Creating backup: ${backup_name}"
        cp -r "${BUILD_DIR}" "${backup_path}"
        
        # Create/update symlink to latest successful build
        ln -sfn "${backup_name}" "${BACKUP_DIR}/last-successful"
        
        log_success "Backup created: ${backup_path}"
        
        # Cleanup old backups (keep last 5)
        local backup_count
        backup_count=$(find "${BACKUP_DIR}" -maxdepth 1 -type d -name "build-*" | wc -l)
        if [[ ${backup_count} -gt 5 ]]; then
            log_info "Cleaning old backups (keeping last 5)"
            find "${BACKUP_DIR}" -maxdepth 1 -type d -name "build-*" | sort | head -n -5 | xargs rm -rf
        fi
    else
        log_info "No existing build to backup"
    fi
}

################################################################################
# CLEANUP FUNCTIONS
################################################################################

safe_cleanup() {
    log_section "Phase 4: Safe Cleanup"
    
    # Validate paths before deletion
    if [[ ! "${BUILD_DIR}" =~ ^"${PROJECT_ROOT}"/dist$ ]]; then
        log_error "Invalid BUILD_DIR path: ${BUILD_DIR}"
        exit 1
    fi
    
    # Remove build directory
    if [[ -d "${BUILD_DIR}" ]]; then
        rm -rf "${BUILD_DIR}"
        log_success "Removed: dist/"
    fi
    
    # Remove node cache
    local cache_dir="${PROJECT_ROOT}/node_modules/.cache"
    if [[ -d "${cache_dir}" ]]; then
        rm -rf "${cache_dir}"
        log_success "Removed: node_modules/.cache"
    fi
    
    # Remove temporary files safely
    local temp_count=0
    while IFS= read -r file; do
        rm -f "${file}"
        ((temp_count++))
    done < <(find "${PROJECT_ROOT}/src" -type f \( -name "*.bak" -o -name "*.tmp" \) 2>/dev/null)
    
    if [[ ${temp_count} -gt 0 ]]; then
        log_success "Removed ${temp_count} temporary files"
    fi
}

################################################################################
# BUILD FUNCTIONS
################################################################################

install_dependencies() {
    log_section "Phase 5: Dependency Installation"
    
    # FIXED: Use pnpm with frozen lockfile for reproducible builds
    log_info "Running pnpm install (frozen lockfile)..."
    if pnpm install --frozen-lockfile --prefer-offline 2>&1 | tee -a "${LOG_FILE}"; then
        log_success "Dependencies installed"
    else
        log_error "Failed to install dependencies"
        log_info "Try: rm -rf node_modules .pnpm-store && pnpm install"
        exit 1
    fi
    
    # Install additional production dependencies if needed
    local extra_deps=("react-helmet-async")
    local extra_dev_deps=("rollup-plugin-visualizer")
    
    log_info "Installing additional dependencies..."
    pnpm add "${extra_deps[@]}" 2>&1 | tee -a "${LOG_FILE}" || log_warning "Some deps may already be installed"
    pnpm add -D "${extra_dev_deps[@]}" 2>&1 | tee -a "${LOG_FILE}" || log_warning "Some dev deps may already be installed"
    
    log_success "All dependencies ready"
}

run_security_audit() {
    log_section "Phase 6: Security Audit"
    
    log_info "Scanning for vulnerabilities..."
    
    # FIXED: Run pnpm audit and capture output
    local audit_json
    if audit_json=$(pnpm audit --prod --json 2>&1); then
        log_success "No vulnerabilities found! ✨"
        return 0
    fi
    
    # Parse audit results
    local critical high moderate low
    critical=$(echo "${audit_json}" | grep -o '"critical":[0-9]*' | cut -d':' -f2 | head -1 || echo "0")
    high=$(echo "${audit_json}" | grep -o '"high":[0-9]*' | cut -d':' -f2 | head -1 || echo "0")
    moderate=$(echo "${audit_json}" | grep -o '"moderate":[0-9]*' | cut -d':' -f2 | head -1 || echo "0")
    low=$(echo "${audit_json}" | grep -o '"low":[0-9]*' | cut -d':' -f2 | head -1 || echo "0")
    
    # Display summary
    log_raw ""
    log_error "Security vulnerabilities detected:"
    log_raw "  🔴 Critical: ${critical}"
    log_raw "  🟠 High:     ${high}"
    log_raw "  🟡 Moderate: ${moderate}"
    log_raw "  ⚪ Low:      ${low}"
    log_raw ""
    
    # Show details
    pnpm audit --prod 2>&1 | head -30 | tee -a "${LOG_FILE}"
    
    # Fail on critical or high vulnerabilities
    if [[ ${critical} -gt 0 ]] || [[ ${high} -gt 0 ]]; then
        log_raw ""
        log_error "CRITICAL or HIGH vulnerabilities found - deployment blocked!"
        log_info "Fix vulnerabilities with: pnpm audit --fix"
        log_info "Or review: pnpm audit --prod"
        exit 1
    fi
    
    # Warn on moderate
    if [[ ${moderate} -gt 0 ]]; then
        log_warning "Moderate vulnerabilities present - review recommended"
        read -p "$(echo -e "${YELLOW}Continue anyway? (y/N):${NC} ")" -n 1 -r
        log_raw ""
        if [[ ! ${REPLY} =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Security audit passed (with warnings)"
}

run_typescript_check() {
    log_section "Phase 7: TypeScript Type Check"
    
    log_info "Checking types..."
    if npx tsc --noEmit 2>&1 | tee -a "${LOG_FILE}"; then
        log_success "TypeScript check passed"
    else
        log_error "TypeScript errors found"
        exit 1
    fi
}

run_linting() {
    log_section "Phase 8: Code Quality Check"
    
    # Check if eslint is configured
    if [[ -f "${PROJECT_ROOT}/.eslintrc.json" ]] || [[ -f "${PROJECT_ROOT}/.eslintrc.js" ]]; then
        log_info "Running ESLint..."
        if npx eslint src/ --max-warnings 0 2>&1 | tee -a "${LOG_FILE}"; then
            log_success "Linting passed"
        else
            log_warning "Linting issues found (non-blocking)"
        fi
    else
        log_info "ESLint not configured, skipping"
    fi
}

build_production() {
    log_section "Phase 9: Production Build"
    
    # Set production environment
    export NODE_ENV=production
    
    log_info "Building application..."
    # FIXED: Use pnpm run build
    if pnpm run build 2>&1 | tee -a "${LOG_FILE}"; then
        log_success "Build completed"
    else
        log_error "Build failed"
        exit 1
    fi
    
    # Verify build output
    if [[ ! -d "${BUILD_DIR}" ]]; then
        log_error "Build directory not created: ${BUILD_DIR}"
        exit 1
    fi
    
    if [[ ! -f "${BUILD_DIR}/index.html" ]]; then
        log_error "index.html not found in build"
        exit 1
    fi
    
    log_success "Build artifacts verified"
}

################################################################################
# VALIDATION & ANALYSIS
################################################################################

analyze_bundle() {
    log_section "Phase 10: Bundle Analysis"
    
    # Calculate total size
    local total_size_kb total_size_mb
    total_size_kb=$(du -sk "${BUILD_DIR}" | cut -f1)
    total_size_mb=$((total_size_kb / 1024))
    
    log_info "Total bundle size: ${total_size_mb} MB"
    
    # Check against limit
    if [[ ${total_size_mb} -gt ${MAX_BUNDLE_SIZE_MB} ]]; then
        log_error "Bundle size (${total_size_mb} MB) exceeds limit (${MAX_BUNDLE_SIZE_MB} MB)"
        log_info "Optimize your bundle before deploying"
        exit 1
    fi
    log_success "Bundle size within limit"
    
    # List largest files
    log_raw ""
    log_info "Largest assets:"
    find "${BUILD_DIR}" -type f -size +${LARGE_FILE_THRESHOLD_KB}k -exec ls -lh {} \; | \
        awk '{print "  " $5 " - " $9}' | \
        sort -hr | \
        head -10 | \
        tee -a "${LOG_FILE}"
    
    # Asset breakdown
    if [[ -d "${BUILD_DIR}/assets" ]]; then
        log_raw ""
        log_info "Asset directory contents:"
        ls -lh "${BUILD_DIR}/assets/" | tail -n +2 | head -15 | tee -a "${LOG_FILE}"
    fi
}

test_preview_server() {
    log_section "Phase 11: Preview Server Test"
    
    log_info "Starting preview server on port ${PREVIEW_PORT}..."
    
    # Start server in background (FIXED: Use pnpm)
    pnpm run preview > "${LOG_DIR}/preview-server.log" 2>&1 &
    PREVIEW_PID=$!
    
    log_info "Preview server PID: ${PREVIEW_PID}"
    
    # Wait for server with timeout
    local attempt=0
    local server_ready=false
    
    while [[ ${attempt} -lt ${MAX_WAIT_TIME} ]]; do
        if curl -sf "http://localhost:${PREVIEW_PORT}" > /dev/null 2>&1; then
            server_ready=true
            break
        fi
        sleep 1
        ((attempt++))
        
        # Show progress every 5 seconds
        if [[ $((attempt % 5)) -eq 0 ]]; then
            log_info "Waiting for server... (${attempt}/${MAX_WAIT_TIME}s)"
        fi
    done
    
    if [[ "${server_ready}" != "true" ]]; then
        log_error "Preview server failed to start within ${MAX_WAIT_TIME}s"
        log_info "Check log: ${LOG_DIR}/preview-server.log"
        exit 1
    fi
    
    log_success "Preview server started"
    
    # Test HTTP response
    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PREVIEW_PORT}")
    
    if [[ "${status_code}" == "200" ]]; then
        log_success "HTTP health check passed (200 OK)"
    else
        log_error "HTTP health check failed (status: ${status_code})"
        exit 1
    fi
    
    # Basic content check
    if curl -s "http://localhost:${PREVIEW_PORT}" | grep -q "<html"; then
        log_success "HTML content validated"
    else
        log_warning "HTML content check failed (non-blocking)"
    fi
    
    # Cleanup
    log_info "Stopping preview server..."
    kill "${PREVIEW_PID}" 2>/dev/null || true
    wait "${PREVIEW_PID}" 2>/dev/null || true
    PREVIEW_PID=""
    
    log_success "Preview server test complete"
}

################################################################################
# REPORTING
################################################################################

generate_release_summary() {
    log_section "Phase 12: Release Documentation"
    
    local summary_file="${PROJECT_ROOT}/RELEASE_SUMMARY.md"
    local git_commit git_branch git_tag
    
    git_commit=$(git rev-parse HEAD)
    git_branch=$(git branch --show-current)
    git_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "No tags")
    
    log_info "Generating release summary..."
    
    cat > "${summary_file}" << EOF
# 🚀 Production Release Summary

**Generated:** $(date +'%Y-%m-%d %H:%M:%S %Z')  
**Environment:** ${DEPLOYMENT_ENV}  
**Status:** ✅ Ready for Deployment

---

## 📦 Build Information

| Property | Value |
|----------|-------|
| Build Date | $(date +'%Y-%m-%d %H:%M:%S') |
| Git Commit | \`${git_commit}\` |
| Git Branch | \`${git_branch}\` |
| Git Tag | \`${git_tag}\` |
| Node Version | $(node --version) |
| npm Version | v$(npm --version) |
| Build Size | $(du -sh "${BUILD_DIR}" | cut -f1) |

---

## 📊 Bundle Analysis

### Size Breakdown
\`\`\`
$(du -sh "${BUILD_DIR}")
Total Size: $(du -sk "${BUILD_DIR}" | cut -f1) KB
Max Allowed: ${MAX_BUNDLE_SIZE_MB} MB
Status: ✅ Within Limit
\`\`\`

### Largest Assets
\`\`\`
$(find "${BUILD_DIR}" -type f -size +${LARGE_FILE_THRESHOLD_KB}k -exec ls -lh {} \; | awk '{print $5 " - " $9}' | sort -hr | head -10)
\`\`\`

### Asset Directory
\`\`\`
$(ls -lh "${BUILD_DIR}/assets/" 2>/dev/null | tail -n +2 | head -10 || echo "No assets directory")
\`\`\`

---

## 🔒 Security Status

\`\`\`
$(npm audit --production 2>&1 | head -15)
\`\`\`

**Status:** ✅ No critical or high vulnerabilities

---

## 📋 Dependencies

### Production
$(cat "${PROJECT_ROOT}/package.json" | grep -A 50 '"dependencies"' | head -20)

### Development
$(cat "${PROJECT_ROOT}/package.json" | grep -A 30 '"devDependencies"' | head -15)

---

## ✅ Pre-Deployment Checklist

- [x] Environment validated
- [x] Dependencies installed (npm ci)
- [x] Security audit passed
- [x] TypeScript type check passed
- [x] Production build successful
- [x] Bundle size within limits
- [x] Build artifacts verified
- [x] Preview server tested
- [x] Backup created
- [ ] Tested on staging environment
- [ ] Deployment approved

---

## 🚀 Deployment Instructions

### Step 1: Review This Summary
Ensure all checks are ✅ green

### Step 2: Deploy to Staging
\`\`\`bash
# Deploy to staging first
npm run deploy:staging
# Or manually copy dist/ to staging server
\`\`\`

### Step 3: Staging Validation
- [ ] Application loads correctly
- [ ] All features working
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile responsive

### Step 4: Deploy to Production
\`\`\`bash
# After staging validation
npm run deploy:production
# Or use your deployment platform
\`\`\`

### Step 5: Post-Deployment
- [ ] Verify production URL
- [ ] Check error monitoring
- [ ] Monitor performance metrics
- [ ] Review user analytics

---

## 🔄 Rollback Plan

If issues occur in production:

### Quick Rollback
\`\`\`bash
# Restore last successful build
cp -r ${BACKUP_DIR}/last-successful ${BUILD_DIR}

# Redeploy
npm run deploy:production
\`\`\`

### Manual Rollback
\`\`\`bash
# List available backups
ls -lh ${BACKUP_DIR}

# Restore specific backup
cp -r ${BACKUP_DIR}/build-YYYYMMDD-HHMMSS ${BUILD_DIR}
\`\`\`

---

## 📝 Additional Resources

- **Build Log:** \`${LOG_FILE}\`
- **Backup Location:** \`${BACKUP_DIR}\`
- **Preview Server Log:** \`${LOG_DIR}/preview-server.log\`

---

## 🔍 Monitoring Checklist (First 24 Hours)

- [ ] Error rate < 1%
- [ ] Response time < 2s
- [ ] No 500 errors
- [ ] User complaints addressed
- [ ] Analytics tracking working

---

## 📞 Support

If deployment issues occur:
1. Check logs in \`${LOG_DIR}\`
2. Review staging tests
3. Execute rollback if needed
4. Contact DevOps team

---

**Note:** This build has been validated and is production-ready. Always test on staging before production deployment.

EOF

    log_success "Release summary created: ${summary_file}"
    
    # Create deployment checklist if doesn't exist
    if [[ ! -f "${PROJECT_ROOT}/DEPLOYMENT_CHECKLIST.md" ]]; then
        log_info "Creating deployment checklist..."
        cat > "${PROJECT_ROOT}/DEPLOYMENT_CHECKLIST.md" << 'EOF'
# 📋 Deployment Checklist

## Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Security audit clean
- [ ] Performance benchmarks met
- [ ] Documentation updated

## Deployment
- [ ] Staging deployment successful
- [ ] Staging validation complete
- [ ] Production deployment approved
- [ ] Monitoring alerts configured

## Post-Deployment
- [ ] Production smoke tests passed
- [ ] Error monitoring active
- [ ] Performance metrics normal
- [ ] Team notified

## Rollback Plan
- [ ] Backup verified
- [ ] Rollback procedure tested
- [ ] Communication plan ready
EOF
        log_success "Deployment checklist created"
    fi
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    clear
    log_section "Production Deployment Script v2.0"
    log_info "Starting deployment preparation at $(date)"
    log_info "Log file: ${LOG_FILE}"
    log_raw ""
    
    # Initialize
    init_logging
    
    # Execute deployment phases
    validate_environment
    validate_dependencies
    create_backup
    safe_cleanup
    install_dependencies
    run_security_audit
    run_typescript_check
    run_linting
    build_production
    analyze_bundle
    test_preview_server
    generate_release_summary
    
    # Success summary
    log_section "Deployment Preparation Complete"
    log_raw ""
    log_success "✨ Build is ready for production deployment!"
    log_raw ""
    log_info "📋 Next Steps:"
    log_info "   1. Review RELEASE_SUMMARY.md"
    log_info "   2. Deploy to staging environment"
    log_info "   3. Validate on staging"
    log_info "   4. Deploy to production"
    log_info "   5. Monitor for 24 hours"
    log_raw ""
    log_info "📦 Deployment Commands:"
    log_info "   git add -A"
    log_info "   git commit -m 'chore: prepare production release v$(date +%Y%m%d)'"
    log_info "   git tag -a v$(date +%Y%m%d) -m 'Production release $(date +%Y-%m-%d)'"
    log_info "   git push origin ${MAIN_BRANCH} --tags"
    log_raw ""
    log_info "🔍 Logs & Artifacts:"
    log_info "   Build: ${BUILD_DIR}"
    log_info "   Log: ${LOG_FILE}"
    log_info "   Backup: ${BACKUP_DIR}/last-successful"
    log_raw ""
}

# Execute main function
main "$@"
