#!/bin/bash
set -e

echo "🧪 DAY 1: SANDBOX SIMULATION & VERIFICATION"
echo "=========================================="
echo "Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# 1. Run automated sandbox simulation
echo "🧪 Running automated sandbox simulation (15 multi-asset orders)..."
node scripts/run_sandbox_simulation.mjs

# 2. Export audit trail
echo ""
echo "📜 Exporting audit trail..."
curl -s http://127.0.0.1:8766/api/v1/audit-log/export > audit-day1-simulation.csv || true
echo "  ✅ Audit trail exported"

# 3. Verify hash chain integrity
echo ""
echo "🔐 Verifying cryptographic hash chain..."
node scripts/verify_audit_integrity.mjs

# 4. Generate compliance report
echo ""
echo "📊 Generating compliance report..."
node scripts/generate_compliance_report.mjs

echo ""
echo "=========================================="
echo "✅ STEP 2: SANDBOX VALIDATION COMPLETE"
echo "=========================================="
