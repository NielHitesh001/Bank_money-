#!/bin/bash
set -e

echo "🚀 WORLD MONEY TERMINAL v3.0.0 — DAY 1 FULL LAUNCH"
echo "==================================================="

# 1. Pre-flight check
bash scripts/pre-flight-check.sh

# 2. Deploy step 1
bash scripts/day1-step1-deploy.sh

# 3. Sandbox step 2
bash scripts/day1-step2-sandbox.sh

# 4. Commit step 3
bash scripts/day1-step3-commit.sh

echo ""
echo "🎉 DAY 1 FULL LAUNCH COMPLETED SUCCESSFULLY"
echo "==================================================="
