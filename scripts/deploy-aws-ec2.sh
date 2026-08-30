#!/bin/bash
# ==============================================================================
# World Money Terminal OS — AWS EC2 (us-east-1) Provisioning & Deployment Script
# ==============================================================================

set -e

echo "============================================================"
echo "☁️ PROVISIONING AWS EC2 PRODUCTION ENVIRONMENT (us-east-1)"
echo "============================================================"

# 1. Update OS packages
echo "==> Step 1: Updating system packages..."
sudo yum update -y || sudo apt-get update -y

# 2. Install Docker & Docker Compose if missing
if ! command -v docker &> /dev/null; then
  echo "==> Step 2: Installing Docker Engine..."
  sudo yum install -y docker || sudo apt-get install -y docker.io
  sudo systemctl enable --now docker
  sudo usermod -aG docker "$USER"
fi

if ! command -v docker-compose &> /dev/null; then
  echo "==> Step 3: Installing Docker Compose..."
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

# 3. Create persistent directories
echo "==> Step 4: Creating persistent volume directories..."
mkdir -p .deployment/audit_records FinanceVault/_system

# 4. Generate .env.production if not present
if [ ! -f .env.production ]; then
  echo "==> Step 5: Initializing .env.production from template..."
  cp .env.production.template .env.production
  chmod 600 .env.production
fi

# 5. Launch full stack via Docker Compose
echo "==> Step 6: Launching production containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# 6. Verification
echo "==> Step 7: Waiting 10s for health checks..."
sleep 10
bash scripts/pre-market-checklist.sh

echo "============================================================"
echo "🎉 AWS EC2 DEPLOYMENT COMPLETE & STACK ONLINE"
echo "   Terminal UI:   http://<EC2-PUBLIC-IP>:5173"
echo "   Operator Dash: http://<EC2-PUBLIC-IP>:8766/monitoring"
echo "   Metrics:       http://<EC2-PUBLIC-IP>:8766/metrics"
echo "   Grafana:       http://<EC2-PUBLIC-IP>:3000 (admin / wmt_operator_admin_2026)"
echo "============================================================"
