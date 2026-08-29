# Data Contracts & Schemas: World Money Terminal OS

Version: **v1.0.0**  
Status: **Production Standard**

---

## 1. Market Tick Contract Schema (`MarketTick.v1`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MarketTick",
  "type": "object",
  "required": ["symbol", "assetClass", "timestamp", "bid", "ask", "last", "volume"],
  "properties": {
    "symbol": { "type": "string", "example": "EUR/USD" },
    "name": { "type": "string", "example": "Euro / US Dollar" },
    "assetClass": { "type": "string", "enum": ["FX", "Commodities", "Indices", "Crypto", "Bonds"] },
    "timestamp": { "type": "string", "format": "date-time" },
    "bid": { "type": "number", "minimum": 0 },
    "ask": { "type": "number", "minimum": 0 },
    "last": { "type": "number", "minimum": 0 },
    "open": { "type": "number", "minimum": 0 },
    "high": { "type": "number", "minimum": 0 },
    "low": { "type": "number", "minimum": 0 },
    "change": { "type": "number" },
    "pctChange": { "type": "number" },
    "volume": { "type": "integer", "minimum": 0 },
    "source": { "type": "string", "example": "aggregated" },
    "freshness": { "type": "string", "example": "12ms" },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
  }
}
```

---

## 2. Order Ticket Execution Schema (`OrderTicket.v1`)

```json
{
  "id": "ORD-128491",
  "symbol": "EUR/USD",
  "side": "BUY",
  "type": "MARKET",
  "executionPrice": 1.0874,
  "units": 91953,
  "notional": 100000,
  "margin": 20000,
  "leverage": 5,
  "timestamp": "2026-08-29T10:14:20.128Z",
  "status": "FILLED",
  "assetClass": "FX"
}
```

---

## 3. Position Ledger & Mark-to-Market Schema (`Position.v1`)

```json
{
  "id": "POS-001",
  "symbol": "EUR/USD",
  "side": "BUY",
  "entryPrice": 1.0845,
  "currentPrice": 1.0874,
  "units": 200000,
  "notional": 216900,
  "margin": 43380,
  "leverage": 5,
  "carryRateAnnual": 1.5,
  "holdingDays": 3,
  "feePaid": 25,
  "spotPnL": 580.00,
  "carryPnL": 26.74,
  "fees": 25.00,
  "netPnL": 581.74,
  "returnOnMarginPct": 1.34
}
```

---

## 4. Quantitative PnL Attribution Formula

Trade and portfolio PnL decomposition follows the canonical formula:

$$\text{Net PnL} = \text{Spot PnL} + \text{Carry PnL} - \text{Execution Fees}$$

Where:
- **Spot PnL** ($\Delta \text{Spot}$):
  $$\text{Spot PnL} = \text{Units} \times (P_{\text{mark}} - P_{\text{entry}}) \quad [\text{for BUY}]$$
  $$\text{Spot PnL} = \text{Units} \times (P_{\text{entry}} - P_{\text{mark}}) \quad [\text{for SELL}]$$
- **Carry PnL** ($\text{Interest Accrual}$):
  $$\text{Carry PnL} = \text{Notional} \times \left( \frac{\Delta r_{\text{annual}}}{100} \right) \times \left( \frac{\text{Holding Days}}{365} \right)$$
- **Return on Margin** ($\text{ROM}$):
  $$\text{ROM} = \left( \frac{\text{Net PnL}}{\text{Margin Required}} \right) \times 100$$
