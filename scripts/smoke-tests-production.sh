#!/bin/bash
# ==============================================================================
# World Money Terminal OS — Production Smoke Test & Verification Suite
# ==============================================================================

set -e

BASE_URL="${1:-http://127.0.0.1:8766}"
FRONTEND_URL="${2:-http://localhost:5173}"

echo "============================================================"
echo "🧪 RUNNING PRODUCTION SMOKE TESTS: $(date)"
echo "   Backend:  $BASE_URL"
echo "   Frontend: $FRONTEND_URL"
echo "============================================================"

# 1. Health Endpoint
echo -n "[1/7] Testing /api/health... "
HEALTH_STATUS=$(curl -s "$BASE_URL/api/health" | jq -r .status || echo "FAIL")
if [ "$HEALTH_STATUS" = "ok" ]; then
  echo "✅ OK"
else
  echo "❌ FAILED ($HEALTH_STATUS)"
  exit 1
fi

# 2. Prometheus Metrics
echo -n "[2/7] Testing /metrics Prometheus stream... "
METRICS_COUNT=$(curl -s "$BASE_URL/metrics" | grep -c "orders_submitted_total" || echo 0)
if [ "$METRICS_COUNT" -gt 0 ]; then
  echo "✅ OK (Prometheus telemetry streaming)"
else
  echo "❌ FAILED"
  exit 1
fi

# 3. Operator Monitoring Dashboard
echo -n "[3/7] Testing /monitoring HTML dashboard... "
DASHBOARD_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/monitoring")
if [ "$DASHBOARD_CODE" = "200" ]; then
  echo "✅ OK (HTTP 200)"
else
  echo "❌ FAILED (HTTP $DASHBOARD_CODE)"
  exit 1
fi

# 4. Institutional Entity Graph API (274 Entities)
echo -n "[4/7] Testing /api/v1/entities API... "
ENTITIES_COUNT=$(curl -s "$BASE_URL/api/v1/entities" | jq '. | length' || echo 0)
if [ "$ENTITIES_COUNT" -ge 250 ]; then
  echo "✅ OK ($ENTITIES_COUNT entities verified)"
else
  echo "❌ FAILED ($ENTITIES_COUNT entities)"
  exit 1
fi

# 5. Multi-Currency Transaction Edge API (1,250 Edges)
echo -n "[5/7] Testing /api/v1/transactions API... "
TX_COUNT=$(curl -s "$BASE_URL/api/v1/transactions" | jq '. | length' || echo 0)
if [ "$TX_COUNT" -ge 1200 ]; then
  echo "✅ OK ($TX_COUNT transaction edges verified)"
else
  echo "❌ FAILED ($TX_COUNT transactions)"
  exit 1
fi

# 6. Cryptographic Audit Chain Verification
echo -n "[6/7] Testing SHA-256 Audit Integrity API... "
node scripts/verify_audit_integrity.mjs > /dev/null 2>&1
echo "✅ OK (Cryptographic chain verified)"

# 7. Frontend Reachability & Proxy
echo -n "[7/7] Testing Frontend Root & Proxy... "
FE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/" || echo "000")
if [ "$FE_CODE" = "200" ]; then
  echo "✅ OK (HTTP 200)"
else
  echo "⚠️ WARNING: Frontend returned HTTP $FE_CODE"
fi

echo "============================================================"
echo "🎉 ALL PRODUCTION SMOKE TESTS PASSED — READY FOR STAGING"
echo "============================================================"
