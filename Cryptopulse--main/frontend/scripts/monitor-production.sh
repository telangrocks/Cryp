#!/bin/bash

echo "🔍 Monitoring CryptoPulse Production Deployment..."
echo ""

# Test health endpoint
echo "Testing /health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" https://cryptopulse-frontend.onrender.com/health)
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)

if [ "$HEALTH_CODE" = "200" ]; then
  echo "✅ Health check: PASSED"
  echo "$HEALTH_RESPONSE" | head -n-1 | jq '.'
else
  echo "❌ Health check: FAILED (Status: $HEALTH_CODE)"
fi

echo ""
echo "Testing main endpoint..."
MAIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://cryptopulse-frontend.onrender.com/)

if [ "$MAIN_CODE" = "200" ]; then
  echo "✅ Main endpoint: PASSED"
else
  echo "❌ Main endpoint: FAILED (Status: $MAIN_CODE)"
fi

echo ""
echo "✅ All checks completed!"
