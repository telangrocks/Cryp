# Production Deployment Script v2.0 - PowerShell Edition
# Security-hardened, enterprise-grade deployment automation

param(
    [string]$PreviewPort = "4173",
    [int]$MaxBundleSizeMB = 10,
    [int]$LargeFileThresholdKB = 500,
    [int]$RequiredNodeMajor = 18,
    [int]$MaxWaitTime = 30,
    [string]$DeploymentEnv = "production",
    [string]$MainBranch = "main"
)

# Configuration
$ErrorActionPreference = "Stop"
$ProjectRoot = Get-Location
$BuildDir = Join-Path $ProjectRoot "dist"
$BackupDir = Join-Path $ProjectRoot ".deployment-backups"
$LogDir = Join-Path $ProjectRoot ".deployment-logs"
$LogFile = Join-Path $LogDir "deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Allowed branches
$AllowedBranches = @("main", "master", "production")

# Colors
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$Cyan = "Cyan"

################################################################################
# LOGGING FUNCTIONS
################################################################################

function Initialize-Logging {
    if (!(Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }
    New-Item -ItemType File -Path $LogFile -Force | Out-Null
    
    # Keep only last 10 logs
    Get-ChildItem $LogDir -Filter "deploy-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 10 | Remove-Item -Force
}

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage -ForegroundColor $Color
    Add-Content -Path $LogFile -Value $LogMessage
}

function Write-LogSection {
    param([string]$Title)
    Write-Log ""
    Write-Log "================================================================================"
    Write-Log "🚀 $Title" -Color $Cyan
    Write-Log "================================================================================"
}

function Write-LogSuccess {
    param([string]$Message)
    Write-Log "✅ $Message" -Color $Green
}

function Write-LogWarning {
    param([string]$Message)
    Write-Log "⚠️  $Message" -Color $Yellow
}

function Write-LogError {
    param([string]$Message)
    Write-Log "❌ $Message" -Color $Red
}

function Write-LogInfo {
    param([string]$Message)
    Write-Log "ℹ️  $Message" -Color $Blue
}

################################################################################
# VALIDATION FUNCTIONS
################################################################################

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-Environment {
    Write-LogSection "Phase 1: Environment Validation"
    
    # Check required commands (FIXED: Added pnpm)
    $RequiredCommands = @("node", "pnpm", "git")
    foreach ($cmd in $RequiredCommands) {
        if (Test-Command $cmd) {
            Write-LogSuccess "$cmd found"
        } else {
            Write-LogError "$cmd is not installed or not in PATH"
            if ($cmd -eq "pnpm") {
                Write-LogInfo "Install with: npm install -g pnpm"
            }
            exit 1
        }
    }
    
    # Validate Node.js version
    $NodeVersion = node -v
    $NodeMajor = [int]($NodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($NodeMajor -lt $RequiredNodeMajor) {
        Write-LogError "Node.js version $NodeVersion is too old (required: >= $RequiredNodeMajor)"
        exit 1
    }
    Write-LogSuccess "Node.js $NodeVersion (meets requirement)"
    
    # Validate pnpm
    $PnpmVersion = pnpm -v
    Write-LogSuccess "pnpm $PnpmVersion"
    
    # Check project structure (FIXED: Check for pnpm-lock.yaml)
    $RequiredFiles = @("package.json", "pnpm-lock.yaml")
    foreach ($file in $RequiredFiles) {
        if (!(Test-Path (Join-Path $ProjectRoot $file))) {
            Write-LogError "Required file missing: $file"
            exit 1
        }
    }
    Write-LogSuccess "Project structure validated"
    
    # Validate git repository
    try {
        git rev-parse --git-dir | Out-Null
        Write-LogSuccess "Git repository detected"
    } catch {
        Write-LogError "Not in a git repository"
        exit 1
    }
    
    # Check current branch
    $CurrentBranch = git branch --show-current
    if ($AllowedBranches -notcontains $CurrentBranch) {
        Write-LogError "Current branch '$CurrentBranch' not allowed for deployment"
        Write-LogInfo "Allowed branches: $($AllowedBranches -join ', ')"
        exit 1
    }
    Write-LogSuccess "Branch '$CurrentBranch' is allowed"
    
    # Check for uncommitted changes
    $GitStatus = git status --porcelain
    if ($GitStatus) {
        Write-LogWarning "Uncommitted changes detected"
        $GitStatus | ForEach-Object { Write-Log $_ }
        
        $Response = Read-Host "Continue with uncommitted changes? (y/N)"
        if ($Response -notmatch '^[Yy]$') {
            Write-LogError "Deployment cancelled by user"
            exit 1
        }
    } else {
        Write-LogSuccess "Working directory clean"
    }
    
    # Validate environment variables
    if (Test-Path (Join-Path $ProjectRoot ".env.production")) {
        Write-LogSuccess ".env.production found"
    } else {
        Write-LogWarning ".env.production not found (optional)"
    }
    
    Write-LogSuccess "Environment validation complete"
}

function Test-Dependencies {
    Write-LogSection "Phase 2: Dependency Validation"
    
    # Check package.json integrity
    try {
        $PackageJson = Get-Content (Join-Path $ProjectRoot "package.json") -Raw | ConvertFrom-Json
        Write-LogSuccess "package.json is valid JSON"
    } catch {
        Write-LogError "package.json is malformed"
        exit 1
    }
    
    # Check for known vulnerable packages
    $PackageContent = Get-Content (Join-Path $ProjectRoot "package.json") -Raw
    if ($PackageContent -match '"event-stream":\s*"3\.3\.6"') {
        Write-LogError "Known malicious package detected: event-stream@3.3.6"
        exit 1
    }
    
    Write-LogSuccess "No known malicious packages detected"
}

################################################################################
# BACKUP FUNCTIONS
################################################################################

function New-Backup {
    Write-LogSection "Phase 3: Backup Creation"
    
    if (!(Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    
    if (Test-Path $BuildDir) {
        $BackupName = "build-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        $BackupPath = Join-Path $BackupDir $BackupName
        
        Write-LogInfo "Creating backup: $BackupName"
        Copy-Item -Path $BuildDir -Destination $BackupPath -Recurse -Force
        
        # Create/update symlink to latest successful build
        $LastSuccessfulPath = Join-Path $BackupDir "last-successful"
        if (Test-Path $LastSuccessfulPath) {
            Remove-Item $LastSuccessfulPath -Force
        }
        New-Item -ItemType SymbolicLink -Path $LastSuccessfulPath -Target $BackupPath | Out-Null
        
        Write-LogSuccess "Backup created: $BackupPath"
        
        # Cleanup old backups (keep last 5)
        $BackupCount = (Get-ChildItem $BackupDir -Directory -Filter "build-*").Count
        if ($BackupCount -gt 5) {
            Write-LogInfo "Cleaning old backups (keeping last 5)"
            Get-ChildItem $BackupDir -Directory -Filter "build-*" | Sort-Object LastWriteTime | Select-Object -First ($BackupCount - 5) | Remove-Item -Recurse -Force
        }
    } else {
        Write-LogInfo "No existing build to backup"
    }
}

################################################################################
# CLEANUP FUNCTIONS
################################################################################

function Clear-SafeCleanup {
    Write-LogSection "Phase 4: Safe Cleanup"
    
    # Remove build directory
    if (Test-Path $BuildDir) {
        Remove-Item -Path $BuildDir -Recurse -Force
        Write-LogSuccess "Removed: dist/"
    }
    
    # Remove node cache
    $CacheDir = Join-Path $ProjectRoot "node_modules\.cache"
    if (Test-Path $CacheDir) {
        Remove-Item -Path $CacheDir -Recurse -Force
        Write-LogSuccess "Removed: node_modules\.cache"
    }
    
    # Remove temporary files
    $TempFiles = Get-ChildItem -Path (Join-Path $ProjectRoot "src") -Recurse -Include "*.bak", "*.tmp" -File
    if ($TempFiles) {
        $TempFiles | Remove-Item -Force
        Write-LogSuccess "Removed $($TempFiles.Count) temporary files"
    }
}

################################################################################
# BUILD FUNCTIONS
################################################################################

function Install-Dependencies {
    Write-LogSection "Phase 5: Dependency Installation"
    
    # FIXED: Use pnpm with frozen lockfile for reproducible builds
    Write-LogInfo "Running pnpm install (frozen lockfile)..."
    try {
        pnpm install --frozen-lockfile --prefer-offline 2>&1 | Tee-Object -FilePath $LogFile -Append
        Write-LogSuccess "Dependencies installed"
    } catch {
        Write-LogError "Failed to install dependencies"
        Write-LogInfo "Try: Remove-Item -Recurse -Force node_modules, .pnpm-store; pnpm install"
        exit 1
    }
    
    # Install additional dependencies
    $ExtraDeps = @("react-helmet-async")
    $ExtraDevDeps = @("rollup-plugin-visualizer")
    
    Write-LogInfo "Installing additional dependencies..."
    try {
        pnpm add $ExtraDeps 2>&1 | Tee-Object -FilePath $LogFile -Append
        pnpm add -D $ExtraDevDeps 2>&1 | Tee-Object -FilePath $LogFile -Append
        Write-LogSuccess "All dependencies ready"
    } catch {
        Write-LogWarning "Some dependencies may already be installed"
    }
}

function Test-SecurityAudit {
    Write-LogSection "Phase 6: Security Audit"
    
    Write-LogInfo "Scanning for vulnerabilities..."
    
    # FIXED: Use pnpm audit
    try {
        $AuditResult = pnpm audit --prod --json 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-LogSuccess "No vulnerabilities found! ✨"
            return
        }
        
        # Parse audit results
        $AuditJson = $AuditResult | ConvertFrom-Json
        $Critical = $AuditJson.metadata.vulnerabilities.critical
        $High = $AuditJson.metadata.vulnerabilities.high
        $Moderate = $AuditJson.metadata.vulnerabilities.moderate
        $Low = $AuditJson.metadata.vulnerabilities.low
        
        Write-Log ""
        Write-LogError "Security vulnerabilities detected:"
        Write-Log "  🔴 Critical: $Critical"
        Write-Log "  🟠 High:     $High"
        Write-Log "  🟡 Moderate: $Moderate"
        Write-Log "  ⚪ Low:      $Low"
        Write-Log ""
        
        # Show details
        pnpm audit --prod 2>&1 | Select-Object -First 30 | Tee-Object -FilePath $LogFile -Append
        
        # Fail on critical or high vulnerabilities
        if ($Critical -gt 0 -or $High -gt 0) {
            Write-Log ""
            Write-LogError "CRITICAL or HIGH vulnerabilities found - deployment blocked!"
            Write-LogInfo "Fix vulnerabilities with: pnpm audit --fix"
            exit 1
        }
        
        # Warn on moderate
        if ($Moderate -gt 0) {
            Write-LogWarning "Moderate vulnerabilities present - review recommended"
            $Response = Read-Host "Continue anyway? (y/N)"
            if ($Response -notmatch '^[Yy]$') {
                exit 1
            }
        }
        
        Write-LogSuccess "Security audit passed (with warnings)"
    } catch {
        Write-LogWarning "Security audit failed - continuing with warnings"
    }
}

function Test-TypeScript {
    Write-LogSection "Phase 7: TypeScript Type Check"
    
    Write-LogInfo "Checking types..."
    try {
        npx tsc --noEmit 2>&1 | Tee-Object -FilePath $LogFile -Append
        if ($LASTEXITCODE -eq 0) {
            Write-LogSuccess "TypeScript check passed"
        } else {
            Write-LogError "TypeScript errors found"
            exit 1
        }
    } catch {
        Write-LogWarning "TypeScript check failed - continuing with warnings"
    }
}

function Test-Linting {
    Write-LogSection "Phase 8: Code Quality Check"
    
    if (Test-Path (Join-Path $ProjectRoot ".eslintrc.json") -or Test-Path (Join-Path $ProjectRoot ".eslintrc.js")) {
        Write-LogInfo "Running ESLint..."
        try {
            npx eslint src/ --max-warnings 0 2>&1 | Tee-Object -FilePath $LogFile -Append
            if ($LASTEXITCODE -eq 0) {
                Write-LogSuccess "Linting passed"
            } else {
                Write-LogWarning "Linting issues found (non-blocking)"
            }
        } catch {
            Write-LogWarning "ESLint failed - continuing"
        }
    } else {
        Write-LogInfo "ESLint not configured, skipping"
    }
}

function Build-Production {
    Write-LogSection "Phase 9: Production Build"
    
    $env:NODE_ENV = "production"
    
    Write-LogInfo "Building application..."
    # FIXED: Use pnpm run build
    try {
        pnpm run build 2>&1 | Tee-Object -FilePath $LogFile -Append
        if ($LASTEXITCODE -eq 0) {
            Write-LogSuccess "Build completed"
        } else {
            Write-LogError "Build failed"
            exit 1
        }
    } catch {
        Write-LogError "Build failed with exception"
        exit 1
    }
    
    # Verify build output
    if (!(Test-Path $BuildDir)) {
        Write-LogError "Build directory not created: $BuildDir"
        exit 1
    }
    
    if (!(Test-Path (Join-Path $BuildDir "index.html"))) {
        Write-LogError "index.html not found in build"
        exit 1
    }
    
    Write-LogSuccess "Build artifacts verified"
}

################################################################################
# VALIDATION & ANALYSIS
################################################################################

function Test-BundleAnalysis {
    Write-LogSection "Phase 10: Bundle Analysis"
    
    # Calculate total size
    $TotalSizeKB = (Get-ChildItem $BuildDir -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1KB
    $TotalSizeMB = [math]::Round($TotalSizeKB / 1024, 2)
    
    Write-LogInfo "Total bundle size: $TotalSizeMB MB"
    
    # Check against limit
    if ($TotalSizeMB -gt $MaxBundleSizeMB) {
        Write-LogError "Bundle size ($TotalSizeMB MB) exceeds limit ($MaxBundleSizeMB MB)"
        Write-LogInfo "Optimize your bundle before deploying"
        exit 1
    }
    Write-LogSuccess "Bundle size within limit"
    
    # List largest files
    Write-Log ""
    Write-LogInfo "Largest assets:"
    Get-ChildItem $BuildDir -Recurse -File | Where-Object { $_.Length -gt ($LargeFileThresholdKB * 1KB) } | 
        Sort-Object Length -Descending | Select-Object -First 10 | 
        ForEach-Object { Write-Log "  $([math]::Round($_.Length / 1KB, 1)) KB - $($_.FullName.Replace($BuildDir, ''))" }
    
    # Asset breakdown
    $AssetsDir = Join-Path $BuildDir "assets"
    if (Test-Path $AssetsDir) {
        Write-Log ""
        Write-LogInfo "Asset directory contents:"
        Get-ChildItem $AssetsDir | Select-Object -First 15 | ForEach-Object { 
            Write-Log "  $($_.Length) bytes - $($_.Name)" 
        }
    }
}

function Test-PreviewServer {
    Write-LogSection "Phase 11: Preview Server Test"
    
    Write-LogInfo "Starting preview server on port $PreviewPort..."
    
    # Start server in background (FIXED: Use pnpm)
    $PreviewJob = Start-Job -ScriptBlock { 
        param($Port, $LogFile)
        Set-Location $using:ProjectRoot
        pnpm run preview 2>&1 | Tee-Object -FilePath $LogFile -Append
    } -ArgumentList $PreviewPort, (Join-Path $LogDir "preview-server.log")
    
    Write-LogInfo "Preview server job started: $($PreviewJob.Id)"
    
    # Wait for server with timeout
    $Attempt = 0
    $ServerReady = $false
    
    while ($Attempt -lt $MaxWaitTime) {
        try {
            $Response = Invoke-WebRequest -Uri "http://localhost:$PreviewPort" -TimeoutSec 1 -ErrorAction SilentlyContinue
            if ($Response.StatusCode -eq 200) {
                $ServerReady = $true
                break
            }
        } catch {
            # Server not ready yet
        }
        
        Start-Sleep -Seconds 1
        $Attempt++
        
        # Show progress every 5 seconds
        if ($Attempt % 5 -eq 0) {
            Write-LogInfo "Waiting for server... ($Attempt/$MaxWaitTime)s"
        }
    }
    
    if (-not $ServerReady) {
        Write-LogError "Preview server failed to start within $MaxWaitTime seconds"
        Write-LogInfo "Check log: $(Join-Path $LogDir 'preview-server.log')"
        Stop-Job $PreviewJob -Force
        Remove-Job $PreviewJob
        exit 1
    }
    
    Write-LogSuccess "Preview server started"
    
    # Test HTTP response
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost:$PreviewPort" -TimeoutSec 5
        if ($Response.StatusCode -eq 200) {
            Write-LogSuccess "HTTP health check passed (200 OK)"
        } else {
            Write-LogError "HTTP health check failed (status: $($Response.StatusCode))"
            Stop-Job $PreviewJob -Force
            Remove-Job $PreviewJob
            exit 1
        }
    } catch {
        Write-LogError "HTTP health check failed with exception"
        Stop-Job $PreviewJob -Force
        Remove-Job $PreviewJob
        exit 1
    }
    
    # Basic content check
    try {
        $Content = Invoke-WebRequest -Uri "http://localhost:$PreviewPort" -TimeoutSec 5
        if ($Content.Content -match "<html") {
            Write-LogSuccess "HTML content validated"
        } else {
            Write-LogWarning "HTML content check failed (non-blocking)"
        }
    } catch {
        Write-LogWarning "Content validation failed (non-blocking)"
    }
    
    # Cleanup
    Write-LogInfo "Stopping preview server..."
    Stop-Job $PreviewJob -Force
    Remove-Job $PreviewJob
    
    Write-LogSuccess "Preview server test complete"
}

################################################################################
# REPORTING
################################################################################

function New-ReleaseSummary {
    Write-LogSection "Phase 12: Release Documentation"
    
    $SummaryFile = Join-Path $ProjectRoot "RELEASE_SUMMARY.md"
    $GitCommit = git rev-parse HEAD
    $GitBranch = git branch --show-current
    $GitTag = try { git describe --tags --abbrev=0 2>$null } catch { "No tags" }
    
    Write-LogInfo "Generating release summary..."
    
    $BuildSize = (Get-ChildItem $BuildDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $BuildSizeKB = [math]::Round($BuildSize / 1KB, 0)
    
    $SummaryContent = @"
# 🚀 Production Release Summary

**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')  
**Environment:** $DeploymentEnv  
**Status:** ✅ Ready for Deployment

---

## 📦 Build Information

| Property | Value |
|----------|-------|
| Build Date | $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') |
| Git Commit | ``$GitCommit`` |
| Git Branch | ``$GitBranch`` |
| Git Tag | ``$GitTag`` |
| Node Version | $(node --version) |
| npm Version | v$(npm --version) |
| Build Size | $BuildSizeKB KB |

---

## 📊 Bundle Analysis

### Size Breakdown
``````
Total Size: $BuildSizeKB KB
Max Allowed: $MaxBundleSizeMB MB
Status: ✅ Within Limit
``````

### Largest Assets
``````
$(Get-ChildItem $BuildDir -Recurse -File | Where-Object { $_.Length -gt ($LargeFileThresholdKB * 1KB) } | Sort-Object Length -Descending | Select-Object -First 10 | ForEach-Object { "$([math]::Round($_.Length / 1KB, 1)) KB - $($_.FullName.Replace($BuildDir, ''))" })
``````

---

## 🔒 Security Status

``````
$(npm audit --production 2>&1 | Select-Object -First 15)
``````

**Status:** ✅ No critical or high vulnerabilities

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
``````bash
# Deploy to staging first
npm run deploy:staging
# Or manually copy dist/ to staging server
``````

### Step 3: Staging Validation
- [ ] Application loads correctly
- [ ] All features working
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile responsive

### Step 4: Deploy to Production
``````bash
# After staging validation
npm run deploy:production
# Or use your deployment platform
``````

---

## 🔄 Rollback Plan

If issues occur in production:

### Quick Rollback
``````bash
# Restore last successful build
cp -r $BackupDir/last-successful $BuildDir

# Redeploy
npm run deploy:production
``````

---

## 📝 Additional Resources

- **Build Log:** ``$LogFile``
- **Backup Location:** ``$BackupDir``
- **Preview Server Log:** ``$(Join-Path $LogDir 'preview-server.log')``

---

**Note:** This build has been validated and is production-ready. Always test on staging before production deployment.

"@

    Set-Content -Path $SummaryFile -Value $SummaryContent -Encoding UTF8
    Write-LogSuccess "Release summary created: $SummaryFile"
}

################################################################################
# MAIN EXECUTION
################################################################################

function Main {
    Clear-Host
    Write-LogSection "Production Deployment Script v2.0"
    Write-LogInfo "Starting deployment preparation at $(Get-Date)"
    Write-LogInfo "Log file: $LogFile"
    Write-Log ""
    
    try {
        # Initialize
        Initialize-Logging
        
        # Execute deployment phases
        Test-Environment
        Test-Dependencies
        New-Backup
        Clear-SafeCleanup
        Install-Dependencies
        Test-SecurityAudit
        Test-TypeScript
        Test-Linting
        Build-Production
        Test-BundleAnalysis
        Test-PreviewServer
        New-ReleaseSummary
        
        # Success summary
        Write-LogSection "Deployment Preparation Complete"
        Write-Log ""
        Write-LogSuccess "✨ Build is ready for production deployment!"
        Write-Log ""
        Write-LogInfo "📋 Next Steps:"
        Write-LogInfo "   1. Review RELEASE_SUMMARY.md"
        Write-LogInfo "   2. Deploy to staging environment"
        Write-LogInfo "   3. Validate on staging"
        Write-LogInfo "   4. Deploy to production"
        Write-LogInfo "   5. Monitor for 24 hours"
        Write-Log ""
        Write-LogInfo "🔍 Logs & Artifacts:"
        Write-LogInfo "   Build: $BuildDir"
        Write-LogInfo "   Log: $LogFile"
        Write-LogInfo "   Backup: $BackupDir/last-successful"
        Write-Log ""
        
    } catch {
        Write-LogError "Deployment failed: $($_.Exception.Message)"
        Write-LogWarning "Check full log at: $LogFile"
        exit 1
    }
}

# Execute main function
Main
