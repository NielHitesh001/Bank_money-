# Resilience, Failover & Circuit Breaker Strategy

This document specifies the fault-tolerance architecture, automatic circuit breaker failovers, and connection state lifecycles across the **World Money Terminal OS**.

---

## 1. Provider Tier Hierarchy

```
┌────────────────────────────────────────────────────────┐
│ Tier 1 (Primary): Polygon.io Real-Time WebSocket       │
│ SLA: <100ms | 99.9% Uptime Target                      │
└───────────────────────────┬────────────────────────────┘
                            │ (Failure condition: No heartbeat > 3,000ms)
                            ▼
┌────────────────────────────────────────────────────────┐
│ Tier 2 (Secondary): Twelve Data WebSocket / SSE        │
│ SLA: <200ms | 99.5% Uptime Target                      │
└───────────────────────────┬────────────────────────────┘
                            │ (Failure condition: HTTP 429 / Rate Limit / Timeout)
                            ▼
┌────────────────────────────────────────────────────────┐
│ Tier 3 (Tertiary): AlphaVantage Global Quote Fallback  │
│ SLA: <500ms | 99.0% Uptime Target                      │
└───────────────────────────┬────────────────────────────┘
                            │ (Failure condition: Offline dev / Network partition)
                            ▼
┌────────────────────────────────────────────────────────┐
│ Tier 4 (Offline Fallback): Local Brownian Motion Engine│
│ SLA: 0ms Local | 100% Uptime Guarantee                 │
└────────────────────────────────────────────────────────┘
```

---

## 2. Connection State Matrix & UI Indicators

| State | Badge Indicator | Active Data Source | Description |
|---|---|---|---|
| **`CONNECTED`** | `🟢 CONNECTED (LIVE)` | Polygon.io / Twelve Data | Real-time interbank feeds arriving $< 300\text{ms}$. |
| **`DEGRADED`** | `🟡 DEGRADED (FAILOVER)` | Secondary / Polling Fallback | Primary WebSocket timeout; operating on secondary provider. |
| **`OFFLINE`** | `🔴 OFFLINE SIMULATOR` | Local Brownian Motion Engine | Offline mode or network partitioned; realistic drift active. |

---

## 3. Circuit Breaker Implementation

The circuit breaker in `src/services/wsManager.js` monitors tick arrival timestamps:

```javascript
// Heartbeat & Outage Detection Loop
const HEARTBEAT_THRESHOLD_MS = 3000;

setInterval(() => {
  const timeSinceLastTick = Date.now() - marketDataStore.getState().lastTickTime;
  if (timeSinceLastTick > HEARTBEAT_THRESHOLD_MS && marketDataStore.getState().connectionState === "CONNECTED") {
    console.warn("Primary market feed heartbeat lost. Activating Tier 2 failover circuit breaker.");
    marketDataStore.setConnectionState("DEGRADED");
  }
}, 1000);
```

---

## 4. Disaster Recovery & Test Scenarios

### 4.1 Simulating Data Feed Outages
- **Simulate Network Failure**: Set `VITE_USE_LIVE_DATA=false` in `.env.local`.
- **Verify Graceful Fallback**: Dashboard immediately switches to Tier 4 Brownian Motion without freezing charts or dropping open positions.
