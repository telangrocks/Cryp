# Deployment Verification Script for PowerShell
param(
    [string]$DeploymentUrl = "https://cryptopulse-frontend.onrender.com",
    [int]$MaxRetries = 40,
    [int]$RetryInterval = 15
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🔍 COMPREHENSIVE DEPLOYMENT VERIFICATION" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "URL: $DeploymentUrl" -ForegroundColor White
Write-Host "Max Retries: $MaxRetries" -ForegroundColor White
Write-Host "Retry Interval: ${RetryInterval}s" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Cyan

function Test-Url {
    param([string]$Url)
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing -TimeoutSec 10
        return $response.StatusCode
    } catch {
        return 000
    }
}

function Test-ResponseContent {
    param([string]$Url)
    try {
        $content = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing -TimeoutSec 10
        $contentString = $content.Content
        
        Write-Host "`n📄 Analyzing response content..." -ForegroundColor Yellow
        
        # Check for service worker
        if ($contentString -match "sw\.js|service-worker|serviceWorker") {
            Write-Host "  ✅ Service Worker referenced" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Service Worker not detected" -ForegroundColor Yellow
        }
        
        # Check for React root
        if ($contentString -match 'id="root"|id=.root') {
            Write-Host "  ✅ React root element present" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  React root element not found" -ForegroundColor Yellow
        }
        
        # Check for error messages in HTML
        if ($contentString -match "error|failed|exception") {
            Write-Host "  ⚠️  Possible error messages in response" -ForegroundColor Yellow
        } else {
            Write-Host "  ✅ No obvious error messages" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ❌ Failed to analyze content: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Wait for deployment
Write-Host "`n📡 Waiting for deployment to be accessible..." -ForegroundColor Yellow
$retryCount = 0
$isAccessible = $false

while ($retryCount -lt $MaxRetries) {
    $status = Test-Url -Url $DeploymentUrl
    
    if ($status -eq 200) {
        Write-Host "✅ Deployment is accessible (HTTP $status)" -ForegroundColor Green
        $isAccessible = $true
        break
    } else {
        $retryCount++
        Write-Host "⏳ Attempt $retryCount/$MaxRetries - Status: $status - Retrying in ${RetryInterval}s..." -ForegroundColor Yellow
        
        if ($retryCount -eq $MaxRetries) {
            Write-Host "❌ Deployment failed to become accessible after $MaxRetries attempts" -ForegroundColor Red
            Write-Host "Last status code: $status" -ForegroundColor Red
            exit 1
        }
        
        Start-Sleep -Seconds $RetryInterval
    }
}

if ($isAccessible) {
    # Check response content
    Test-ResponseContent -Url $DeploymentUrl
    
    # Check service worker endpoint
    Write-Host "`n🔧 Checking Service Worker endpoint..." -ForegroundColor Yellow
    $swStatus = Test-Url -Url "$DeploymentUrl/sw.js"
    if ($swStatus -eq 200) {
        Write-Host "  ✅ Service Worker accessible (HTTP $swStatus)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Service Worker returned status $swStatus (may be optional)" -ForegroundColor Yellow
    }
    
    # Check favicon
    Write-Host "`n🎨 Checking favicon..." -ForegroundColor Yellow
    $faviconStatus = Test-Url -Url "$DeploymentUrl/favicon.ico"
    if ($faviconStatus -eq 200 -or $faviconStatus -eq 204) {
        Write-Host "  ✅ Favicon accessible (HTTP $faviconStatus)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Favicon returned status $faviconStatus (non-critical)" -ForegroundColor Yellow
    }
    
    # Response time check
    Write-Host "`n⏱️  Checking response time..." -ForegroundColor Yellow
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri $DeploymentUrl -Method GET -UseBasicParsing -TimeoutSec 10
        $stopwatch.Stop()
        $responseTime = $stopwatch.Elapsed.TotalSeconds
        
        Write-Host "  Response time: ${responseTime}s" -ForegroundColor White
        
        if ($responseTime -lt 2.0) {
            Write-Host "  ✅ Good response time" -ForegroundColor Green
        } elseif ($responseTime -lt 5.0) {
            Write-Host "  ⚠️  Acceptable response time" -ForegroundColor Yellow
        } else {
            Write-Host "  ⚠️  Slow response time" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ❌ Failed to measure response time: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "📋 MANUAL VERIFICATION CHECKLIST" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please verify the following in your browser:" -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 Open: $DeploymentUrl" -ForegroundColor White
Write-Host ""
Write-Host "Console Tab (F12 → Console):" -ForegroundColor Yellow
Write-Host "  [ ] No 'Error at f (router.js:241:11)' messages" -ForegroundColor White
Write-Host "  [ ] No 'Error at M (SplashScreen.tsx:15:20)' messages" -ForegroundColor White
Write-Host "  [ ] No 'Production error: Error' messages" -ForegroundColor White
Write-Host "  [ ] Service Worker registers successfully" -ForegroundColor White
Write-Host "  [ ] '[SW] Registering service worker...' message present" -ForegroundColor White
Write-Host "  [ ] ErrorLogger initialized message present" -ForegroundColor White
Write-Host "  [ ] No AbortError messages (from previous issues)" -ForegroundColor White
Write-Host ""
Write-Host "Application Tab (F12 → Application):" -ForegroundColor Yellow
Write-Host "  [ ] Service Worker: Status = 'activated'" -ForegroundColor White
Write-Host "  [ ] Service Worker: Version = 1.0.1 or later" -ForegroundColor White
Write-Host "  [ ] Cache Storage: Present and populated" -ForegroundColor White
Write-Host ""
Write-Host "Network Tab (F12 → Network):" -ForegroundColor Yellow
Write-Host "  [ ] All resources load successfully (status 200)" -ForegroundColor White
Write-Host "  [ ] No failed requests (except non-critical like favicon)" -ForegroundColor White
Write-Host "  [ ] Router navigation works without errors" -ForegroundColor White
Write-Host ""
Write-Host "Functionality Test:" -ForegroundColor Yellow
Write-Host "  [ ] App loads without white screen" -ForegroundColor White
Write-Host "  [ ] SplashScreen displays and transitions" -ForegroundColor White
Write-Host "  [ ] Home page loads correctly" -ForegroundColor White
Write-Host "  [ ] Navigation works (if applicable)" -ForegroundColor White
Write-Host "  [ ] No visible errors on screen" -ForegroundColor White
Write-Host ""
Write-Host "Sources Tab (F12 → Sources):" -ForegroundColor Yellow
Write-Host "  [ ] Source maps available for debugging" -ForegroundColor White
Write-Host "  [ ] Can view original TypeScript/JSX code" -ForegroundColor White
Write-Host ""

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "✅ AUTOMATED VERIFICATION COMPLETE" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Next Actions:" -ForegroundColor Yellow
Write-Host "  1. Complete manual checklist above" -ForegroundColor White
Write-Host "  2. If any issues found, check browser console" -ForegroundColor White
Write-Host "  3. If all clear, deployment is successful! 🎉" -ForegroundColor White
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
