#!/bin/bash

echo "🧪 CryptoPulse Pre-Deployment Testing"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Testing: $description... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $status)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status)"
        ((FAILED++))
    fi
}

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo ""

# Build application
echo "🔨 Building application..."
pnpm build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Build failed${NC}"
    ((FAILED++))
    exit 1
fi
echo ""

# Start server in background
echo "🚀 Starting server..."
pnpm start &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Run tests
echo ""
echo "🧪 Running endpoint tests..."
echo "─────────────────────────────"

test_endpoint "http://localhost:10000/health" "200" "Health Check Endpoint"
test_endpoint "http://localhost:10000/" "200" "Home Page"
test_endpoint "http://localhost:10000/dashboard" "200" "Dashboard Route (SPA)"
test_endpoint "http://localhost:10000/nonexistent" "200" "Non-existent Route (Should serve index.html)"

echo ""
echo "─────────────────────────────"
echo "📊 Test Results:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

# Cleanup
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix issues before deploying.${NC}"
    exit 1
fi
