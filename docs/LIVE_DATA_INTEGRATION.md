# Live Market Data Integration & Circuit Breaker Guide

This guide details the pipeline for transitioning from local simulation to live institutional market data feeds (**Polygon.io**, **Twelve Data**, and **AlphaVantage**).

---

## 1. Pipeline Architecture

```
                                  ┌───────────────────────────┐
                                  │ Primary: Polygon.io WS    │
                                  └─────────────┬─────────────┘
                                                │ (Failover 1)
                                                ▼
┌───────────────────────────┐     ┌───────────────────────────┐
│ Components / Blotter      │ ◄───┤ marketDataAggregator.js   │ ◄── Secondary: Twelve Data
└───────────────────────────┘     └─────────────┬─────────────┘
                                                │ (Failover 2)
                                                ▼
                                  ┌───────────────────────────┐
                                  │ Circuit Breaker Fallback: │
                                  │ Stochastic Micro-Tick Gen │
                                  └───────────────────────────┘
```

---

## 2. Configuration & Environment Variables

Add your provider credentials to `.env.local`:

```env
# Enable Live Provider Streaming (true = live, false = local simulation)
VITE_USE_LIVE_DATA=false

# Tier 1 Provider: Polygon.io (FX, Equities, Crypto)
VITE_POLYGON_API_KEY=your_polygon_api_key_here

# Tier 2 Provider: Twelve Data (Forex, Commodities, Global Equities)
VITE_TWELVE_DATA_API_KEY=your_twelve_data_api_key_here

# Tier 3 Provider: AlphaVantage (Forex & Commodities fallback)
VITE_ALPHAVANTAGE_API_KEY=your_alphavantage_api_key_here
```

---

## 3. Provider Adapters

All external providers normalize incoming tick feeds into the canonical [`MarketTick.v1`](./DATA_CONTRACT.md) schema via `src/services/marketDataAggregator.js`:

```javascript
import { normalizeMarketTick } from "./marketDataAggregator.js";

// Polygon WebSocket Tick Normalizer
export function handlePolygonMessage(eventData) {
  const parsed = JSON.parse(eventData);
  parsed.forEach((msg) => {
    if (msg.ev === "C" || msg.ev === "XA") { // Currency / Crypto quote
      const tick = normalizeMarketTick({
        symbol: msg.p,
        bid: msg.b,
        ask: msg.a,
        last: (msg.b + msg.a) / 2,
        volume: msg.v || 0,
        timestamp: new Date(msg.t).toISOString(),
      }, "polygon");
      wsMarketManager.notify(tick);
    }
  });
}
```

---

## 4. Automatic Circuit Breaker & Fallback

1. **Heartbeat Monitoring**: If no ticks arrive from the primary provider within **3,000ms**, the system marks connection as `DEGRADED` and initiates failover to Twelve Data.
2. **Offline Resilience**: If all external APIs are unreachable (e.g. offline dev, market closure, rate limiting), the system activates the **Local Stochastic Brownian Motion Generator** without interrupting UI rendering or crashing tests.
