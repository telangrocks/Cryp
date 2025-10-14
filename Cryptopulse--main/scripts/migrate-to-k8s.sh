#!/bin/bash

# =============================================================================
# CryptoPulse Kubernetes Migration Script
# =============================================================================

set -e

echo "🚀 Starting CryptoPulse Kubernetes Migration..."

# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets
kubectl create secret generic cryptopulse-secrets \
  --from-literal=database-url="postgresql://user:pass@postgres:5432/cryptopulse_prod" \
  --from-literal=redis-url="redis://redis:6379" \
  --from-literal=jwt-secret="your-jwt-secret" \
  --namespace=cryptopulse-prod

# Deploy services
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Apply security policies
kubectl apply -f security/security-policy.yaml
kubectl apply -f security/network-policy.yaml

# Wait for deployments
kubectl rollout status deployment/cryptopulse-backend -n cryptopulse-prod
kubectl rollout status deployment/cryptopulse-frontend -n cryptopulse-prod

echo "✅ Kubernetes migration completed successfully!"
echo "🔍 Check status with: kubectl get pods -n cryptopulse-prod"
