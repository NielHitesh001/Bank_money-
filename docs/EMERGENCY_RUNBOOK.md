# World Money Terminal — Emergency Operations Playbook & Incident Runbook

---

## 🚨 Emergency Severity Levels

| Severity | Definition | Response SLA | Action Trigger |
|---|---|---|---|
| **P0 (CRITICAL)** | Broker connection down during market hours, audit log failure, or unauthorized order detected | **$< 2\text{ minutes}$** | Trigger Emergency Kill Switch $\rightarrow$ Page Lead Operator |
| **P1 (HIGH)** | Margin breach $>90\%$, 1-Day VaR limit exceeded, circuit breaker tripped to `OPEN` | **$< 10\text{ minutes}$** | Review open blotter positions $\rightarrow$ Unwind riskiest legs |
| **P2 (MEDIUM)** | Rate limiter spikes, data latency $>300\text{ms}$, websocket degraded | **$< 30\text{ minutes}$** | Check upstream feed providers $\rightarrow$ Switch data tiers |

---

## 🛑 Step-by-Step Incident Response Procedures

### Scenario 1: Emergency Trading Halt (Kill Switch)
**Trigger**: Abnormal fills, unexpected market volatility, or risk breach.

1. **Engage Kill Switch via Terminal UI**:
   - Click the **`⚡ LIVE GUARDRAILS`** button in the Order Ticket header until it displays **`🛑 HALTED`**.
2. **Engage Kill Switch via API**:
   ```bash
   curl -X POST http://127.0.0.1:8766/api/audit \
     -H "Content-Type: application/json" \
     -d '{"event": "EMERGENCY KILL SWITCH ENGAGED VIA CLI"}'
   ```
3. **Verify Trading Halt**:
   - All subsequent order attempts will immediately return `HTTP 403 Forbidden` / `REJECTED BY GUARDRAILS`.
   - Existing open positions will remain tracked in the blotter without forced market liquidation.

---

### Scenario 2: Alpaca Broker Outage & Failover Recovery
**Trigger**: Alpaca returns 500/502 errors or connection drops.

1. **Verify Circuit Breaker State**:
   - Navigate to [`http://127.0.0.1:8766/monitoring`](http://127.0.0.1:8766/monitoring).
   - Check `Broker Connectivity` badge: `DEGRADED 🔴` or `OPEN`.
2. **Confirm Failover Routing**:
   - Orders will automatically route to `INTERNAL_SIMULATOR (FAILOVER)` with zero order loss.
3. **Recovery Verification**:
   - Circuit breaker enters `HALF_OPEN` after 60 seconds.
   - Once Alpaca recovers, 2 successful probes restore `CLOSED 🟢` status.

---

### Scenario 3: Investigating Audit Log Integrity
**Trigger**: End-of-day compliance audit or suspected log tampering.

Run the automated integrity verifier:
```bash
node scripts/verify_audit_integrity.mjs
```
- Returns `✅ Hash chain VALID: N records verified` if SHA-256 chain is unbroken.
- Returns `❌ Broken chain at sequence ID` with exact tampering offset if any log field was modified.

---

## 📞 Escalation & Contacts
- **Primary On-Call**: Lead Systems Architect (`solo-operator`)
- **Emergency Ops Channel**: Slack `#trading-ops`
- **Monitoring Telemetry**: `http://127.0.0.1:8766/monitoring`
- **Raw Prometheus Stream**: `http://127.0.0.1:8766/metrics`
