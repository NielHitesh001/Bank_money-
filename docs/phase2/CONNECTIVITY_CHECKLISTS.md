# 📋 OPERATIONAL RUNBOOKS & CONNECTIVITY CHECKLISTS
## World Money Terminal OS — Daily & Emergency Procedures
**Target**: SEC Rule 17a-5 / FINRA Operational Compliance

---

## 1. Daily 4:00 PM ET Compliance Ritual

Execute every trading day at market close:
```bash
# Automated 1-step audit export, hash verification, and Git archive
bash scripts/daily-4pm-ritual.sh
```

**Verification Checklist**:
- [ ] Audit records exported to `.deployment/audit_records/audit-day-XX.csv`
- [ ] SHA-256 cryptographic chain validated unbroken (`VALID ✅`)
- [ ] Daily compliance snapshot JSON archived in `FinanceVault/_system/compliance_reports/`
- [ ] System snapshot committed to Git repository

---

## 2. Pre-Market Launch Checklist (8:30 AM – 9:15 AM ET)

```bash
# Verify backend server and frontend dev port
curl -s http://127.0.0.1:8766/api/health | jq .status
curl -s http://localhost:5173/ | head -c 50
```

**Operator Pre-Flight Verification**:
- [ ] API Connection: `CONNECTED (sub-30ms)`
- [ ] Kill Switch Latency: Verified $<100\text{ms}$
- [ ] Greeks & VaR Engine: Calculated on open portfolio
- [ ] Rate Limiter: Active (60 orders/min quota)
- [ ] Prometheus Scraper: Streaming to [`http://127.0.0.1:8766/metrics`](http://127.0.0.1:8766/metrics)

---

## 3. Intra-Day Monitoring Intervals

| Interval | Action Item | Target Metric |
|---|---|---|
| **Every 15 Min** | Review PnL Attribution & Spot Delta | Margin Usage $<50\%$ |
| **Every 1 Hour** | Check Operator Dashboard at `/monitoring` | Latency P99 $<100\text{ms}$ |
| **Every 4 Hours** | Reconcile Broker Positions vs Local Blotter | Discrepancy $=0$ |
| **On Flash Crash** | Trigger Emergency Kill Switch (`Cmd+Shift+K`) | Full execution halt $<100\text{ms}$ |

---

## 4. Emergency Incident Escalation Matrix

```
┌────────────────────────────────────────────────────────────┐
│                  EMERGENCY INCIDENT TIERS                  │
├────────────────────────────────────────────────────────────┤
│ P0: Broker Outage / Flash Crash → KILL SWITCH + FAILOVER  │
│ P1: VaR Limit Breach (> $5k loss) → HALT NEW ORDERS        │
│ P2: Rate Limit 429 Errors → REDUCE ORDER FREQUENCY         │
│ P3: Telemetry Stream Drop → RESTART METRICS COLLECTOR      │
└────────────────────────────────────────────────────────────┘
```

**Emergency Hotkeys**:
- `Cmd+Shift+K`: **Emergency Kill Switch** (Halt all trading routes)
- `Cmd+K`: **Bloomberg Command Palette** (`ALLQ`, `GRPH`, `VAR`, `BLOT`)
