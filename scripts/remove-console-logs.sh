#!/bin/bash
find src/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak '/console\.log(/d' {} \;
find src/ -type f -name "*.bak" -delete
echo "✅ Removed console.log statements"
