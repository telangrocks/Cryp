#!/bin/bash

# Deployment Verification Script
# This script checks if the deployment is successful and error-free

set -e

DEPLOYMENT_URL="${1:-https://cryptopulse-frontend.onrender.com}"
MAX_RETRIES=30
RETRY_INTERVAL=10

echo "=================================================="
echo "🔍 DEPLOYMENT VERIFICATION SCRIPT"
echo "=================================================="
echo "Target URL: $DEPLOYMENT_URL"
echo "Max Retries: $MAX_RETRIES"
echo "Retry Interval: ${RETRY_INTERVAL}s"
echo "=================================================="

# Function to check if URL is accessible
check_url() {
    local url=$1
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    echo "$status_code"
}

# Function to check for specific errors in page content
check_errors() {
    local url=$1
    local content=$(curl -s "$url" 2>/dev/null || echo "")
    
    # Check for service worker
    if echo "$content" | grep -q "sw.js"; then
        echo "✅ Service Worker referenced in HTML"
    else
        echo "⚠️  Warning: Service Worker not found in HTML"
    fi
    
    # Check for error boundary
    if echo "$content" | grep -q "ErrorBoundary\|error-boundary"; then
        echo "✅ Error Boundary possibly included"
    fi
}

# Wait for deployment to be accessible
echo -e "\n📡 Checking deployment accessibility..."
retry_count=0

while [ $retry_count -lt $MAX_RETRIES ]; do
    status=$(check_url "$DEPLOYMENT_URL")
    
    if [ "$status" == "200" ]; then
        echo "✅ Deployment is accessible (HTTP $status)"
        break
    else
        retry_count=$((retry_count + 1))
        echo "⏳ Attempt $retry_count/$MAX_RETRIES - Status: $status - Retrying in ${RETRY_INTERVAL}s..."
        
        if [ $retry_count -eq $MAX_RETRIES ]; then
            echo "❌ Deployment failed to become accessible after $MAX_RETRIES attempts"
            exit 1
        fi
        
        sleep $RETRY_INTERVAL
    fi
done

# Check deployment content
echo -e "\n📄 Analyzing deployment content..."
check_errors "$DEPLOYMENT_URL"

# Check service worker endpoint
echo -e "\n🔧 Checking Service Worker..."
sw_status=$(check_url "${DEPLOYMENT_URL}/sw.js")
if [ "$sw_status" == "200" ]; then
    echo "✅ Service Worker is accessible (HTTP $sw_status)"
else
    echo "⚠️  Warning: Service Worker returned status $sw_status"
fi

echo -e "\n=================================================="
echo "✅ DEPLOYMENT VERIFICATION COMPLETE"
echo "=================================================="
echo "Next Steps:"
echo "1. Open: $DEPLOYMENT_URL"
echo "2. Open browser DevTools (F12)"
echo "3. Check Console for errors"
echo "4. Verify Service Worker in Application tab"
echo "=================================================="
