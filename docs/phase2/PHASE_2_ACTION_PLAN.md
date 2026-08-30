# 🚀 PHASE 2: PRODUCTION DEPLOYMENT & LIVE TRADING ACTION PLAN
## Timeline: August 30 – September 15, 2026
**Target**: Deploy to Production & Execute Live $50,000 Capital Allocation

---

## Phase 2 Implementation Timeline

```
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 2 TIMELINE                         │
├─────────────────────────────────────────────────────────────┤
│ Aug 30 (Today)    │ Audit Sign-Off + Production Env Setup   │
│ Sep 1-5 (Week 1)  │ Cloud Deployment + Telemetry Stack      │
│ Sep 8-12 (Week 2) │ Live $50k Capital Activation (Alpaca)   │
│ Sep 15+           │ Post-Launch Review & Scale              │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation Guide

### Step 1: Environment & Credential Vault Configuration
Create `.env.production` on the production host:
```bash
ENVIRONMENT=production
NODE_ENV=production
ALPACA_MODE=live
ALPACA_KEY=<your_live_key>
ALPACA_SECRET=<your_live_secret>
FRED_API_KEY=<your_fred_key>
LOG_LEVEL=info
DATABASE_URL=postgresql://user:pass@localhost:5432/world_money_terminal
AUDIT_LOG_RETENTION=2555
```

### Step 2: Production Multi-Stage Docker Container
Use the existing production Dockerfile:
```bash
docker build -t wmt-os:v3.0.0-ga .
docker run -d -p 8766:8766 -p 5173:5173 --env-file .env.production wmt-os:v3.0.0-ga
```

### Step 3: Telemetry & Prometheus Alerting Setup
Mount Prometheus configuration (`prometheus.yml`) scraping `http://localhost:8766/metrics` every 15 seconds:
```yaml
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'world-money-terminal'
    static_configs:
      - targets: ['localhost:8766']
    metrics_path: '/metrics'
```

### Step 4: Staged Live Capital Deployment ($50,000 Total)
1. **Day 9 (Sept 8)**: Micro-test trade (1 order @ \$1,000 `SPY`) $\rightarrow$ Verify live execution receipt, slippage, and PnL.
2. **Day 10 (Sept 9)**: 5 live orders @ \$2,000 each (\$10,000 notional) $\rightarrow$ Reconcile broker positions.
3. **Day 11 (Sept 10)**: 10 live orders @ \$3,000 each (\$30,000 notional) $\rightarrow$ Validate risk engines and Greeks.
4. **Day 12-14 (Sept 11-15)**: Full \$50,000 capital deployment across multi-asset instruments.
