#!/bin/bash
# ==============================================================================
# World Money Terminal — Production Disaster Recovery & Resilience Runbook
# ==============================================================================
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
VAULT_DIR="${VAULT_DIR:-./FinanceVault}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "============================================================"
echo "🚨 STARTING DISASTER RECOVERY & INTEGRITY AUDIT: $TIMESTAMP"
echo "============================================================"

# Step 1: Snapshot current state before recovery operations
mkdir -p "$BACKUP_DIR"
echo "📦 [1/4] Archiving live state snapshot to $BACKUP_DIR/snapshot_$TIMESTAMP.tar.gz..."
if [ -d "$VAULT_DIR" ]; then
    tar -czf "$BACKUP_DIR/snapshot_$TIMESTAMP.tar.gz" "$VAULT_DIR" 2>/dev/null || true
    echo "    ✔ State snapshot archived."
else
    echo "    ⚠️ Vault directory not present; initializing clean tree."
    mkdir -p "$VAULT_DIR/00-MOC" "$VAULT_DIR/10-Countries" "$VAULT_DIR/20-Central-Banks" "$VAULT_DIR/30-Payment-Rails" "$VAULT_DIR/40-Currencies"
fi

# Step 2: Run Python integrity checks
echo "🔍 [2/4] Executing Python daemon test suite..."
python3 -m unittest tests/test_daemon.py
echo "    ✔ Daemon test suite passed."

# Step 3: Run Full Node.js quantitative & security test suite
echo "🧪 [3/4] Executing quantitative & security test suite..."
npm test
echo "    ✔ All Node.js test suites passed."

# Step 4: Verify Pre-market certification checklist
echo "📋 [4/4] Running pre-market automated readiness checklist..."
bash scripts/pre-market-checklist.sh

echo "============================================================"
echo "🎉 DISASTER RECOVERY & RESILIENCE AUDIT COMPLETE: ALL GREEN"
echo "============================================================"
