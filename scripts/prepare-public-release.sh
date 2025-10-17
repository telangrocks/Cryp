#!/bin/bash
set -e

echo "=================================================="
echo "🚀 PREPARING APP FOR PUBLIC RELEASE"
echo "=================================================="

# 1. Clean up
echo -e "\n📦 Cleaning up..."
rm -rf dist node_modules/.cache
find src/ -name "*.bak" -delete
find src/ -name "*.tmp" -delete

# 2. Install/update dependencies
echo -e "\n📦 Installing dependencies..."
npm install
npm install react-helmet-async rollup-plugin-visualizer -D

# 3. Run security audit
echo -e "\n🔒 Running security audit..."
npm audit --production || echo "⚠️  Security vulnerabilities found - review before deploying"

# 4. TypeScript check
echo -e "\n🔍 Running TypeScript check..."
npx tsc --noEmit || exit 1

# 5. Remove console.logs
echo -e "\n🧹 Removing console.logs..."
bash scripts/remove-console-logs.sh 2>/dev/null || echo "Script not found, skipping..."

# 6. Build
echo -e "\n🔨 Building for production..."
npm run build

# 7. Analyze bundle
echo -e "\n📊 Analyzing bundle size..."
du -sh dist/
ls -lh dist/assets/ | head -20

# 8. Check for large files
echo -e "\n⚠️  Checking for large files (>200KB)..."
find dist/ -type f -size +200k -exec ls -lh {} \;

# 9. Test build locally
echo -e "\n🧪 Testing production build..."
npm run preview &
PREVIEW_PID=$!
sleep 5

# Test if preview server is running
if curl -s http://localhost:4173 > /dev/null; then
    echo "✅ Preview server running successfully"
    kill $PREVIEW_PID
else
    echo "❌ Preview server failed to start"
    kill $PREVIEW_PID 2>/dev/null || true
    exit 1
fi

# 10. Create release summary
echo -e "\n📝 Creating release summary..."
cat << EOF > RELEASE_SUMMARY.md
# Release Summary - $(date +%Y-%m-%d)

## Build Information
- Build Date: $(date)
- Git Commit: $(git rev-parse HEAD)
- Git Branch: $(git branch --show-current)
- Node Version: $(node --version)
- NPM Version: $(npm --version)

## Bundle Size
\`\`\`
$(du -sh dist/)
\`\`\`

## Assets
\`\`\`
$(ls -lh dist/assets/ | head -10)
\`\`\`

## Dependencies
- Total: $(cat package.json | grep -c '"')
- Production: $(cat package.json | jq '.dependencies | length' 2>/dev/null || echo "N/A")
- Development: $(cat package.json | jq '.devDependencies | length' 2>/dev/null || echo "N/A")

## Security Audit
\`\`\`
$(npm audit --production 2>&1 | head -20)
\`\`\`

## Checklist Status
See DEPLOYMENT_CHECKLIST.md for complete checklist

## Next Steps
1. Review DEPLOYMENT_CHECKLIST.md
2. Test on staging environment
3. Deploy to production
4. Monitor for 24 hours
EOF

echo -e "\n=================================================="
echo "✅ PUBLIC RELEASE PREPARATION COMPLETE"
echo "=================================================="
echo ""
echo "📋 Review the following:"
echo "  1. RELEASE_SUMMARY.md - Build information"
echo "  2. DEPLOYMENT_CHECKLIST.md - Pre-deployment tasks"
echo "  3. dist/stats.html - Bundle analysis (if available)"
echo ""
echo "🚀 Ready to deploy!"
echo "   Run: git add -A && git commit -m 'chore: prepare for public release'"
echo "   Then: git push origin main"
echo ""
echo "=================================================="
