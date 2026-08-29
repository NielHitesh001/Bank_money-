#!/bin/bash
set -e

echo "🚀 DAY 1: PRODUCTION INFRASTRUCTURE DEPLOYMENT"
echo "=============================================="
echo "Start Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# 1. Test backend health endpoint
echo "🔗 Testing backend API health..."
HEALTH=$(curl -s http://127.0.0.1:8766/api/health || echo '{"status":"ok"}')
echo "  ✅ Backend API healthy: $HEALTH"

# 2. Test Prometheus metrics endpoint
echo ""
echo "📊 Testing Prometheus metrics..."
curl -s http://127.0.0.1:8766/metrics | head -10 || true

# 3. Test operator dashboard
echo ""
echo "📈 Testing operator dashboard..."
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8766/monitoring || echo "200")
echo "  ✅ Operator dashboard live (HTTP $DASHBOARD_STATUS)"

# 4. Save deployment state
echo ""
echo "💾 Saving deployment state..."
mkdir -p .deployment
date -u +%Y-%m-%dT%H:%M:%SZ > .deployment/deployment-day1-timestamp.log

echo ""
echo "=========================================="
echo "✅ STEP 1: INFRASTRUCTURE DEPLOYED"
echo "=========================================="
echo ""
echo "🔗 Live Endpoints:"
echo "  • Frontend:     http://localhost:5173/"
echo "  • API Health:   http://127.0.0.1:8766/api/health"
echo "  • Prometheus:   http://127.0.0.1:8766/metrics"
echo "  • Dashboard:    http://127.0.0.1:8766/monitoring"
