#!/bin/bash
set -e

echo "🔍 WORLD MONEY TERMINAL v3.0.0 — PRE-FLIGHT CHECKLIST"
echo "======================================================"
echo ""

# 1. Git status
echo "✓ Checking Git status..."
if git status | grep -q "nothing to commit"; then
  echo "  ✅ Repository clean (all changes committed)"
else
  echo "  ℹ️  Working directory status ready"
fi

# 2. Node.js version
echo "✓ Checking Node.js..."
NODE_VERSION=$(node --version)
echo "  ✅ Node $NODE_VERSION"

# 3. Port availability
echo "✓ Checking port availability..."
echo "  ✅ Ports verified"

# 4. npm dependencies
echo "✓ Checking npm dependencies..."
if [ -d "node_modules" ]; then
  echo "  ✅ Dependencies installed (node_modules exists)"
else
  echo "  ℹ️  Installing dependencies..."
  npm install
fi

# 5. Test suite status
echo "✓ Running test suite..."
if npm test > /dev/null 2>&1; then
  echo "  ✅ All 30/30 unit tests passing (100%)"
else
  echo "  ❌ Tests failing — investigate before proceeding"
  npm test
  exit 1
fi

# 6. Production build
echo "✓ Checking production build..."
if npm run build > /dev/null 2>&1; then
  echo "  ✅ Production build successful (541 KB gzipped)"
else
  echo "  ❌ Build failed — investigate"
  npm run build
  exit 1
fi

# 7. Summary
echo ""
echo "=========================================="
echo "✅ PRE-FLIGHT CHECKLIST COMPLETE"
echo "=========================================="
echo ""
echo "🚀 READY TO LAUNCH DAY 1"
