/**
 * Day 4 Order Execution Script
 * Submits 15 scaled test orders (~$2,000 notional each) across multi-asset instruments.
 */

import { routeOrderSubmission } from "../src/services/orderRouting.js";
import { immutableAuditLog } from "../src/services/auditLog/immutableAuditLog.js";

const DAY4_ORDERS = [
  { symbol: "SPY", side: "BUY", qty: 3.5, price: 580.25, notional: 2030.88 },
  { symbol: "QQQ", side: "BUY", qty: 4.7, price: 425.50, notional: 1999.85 },
  { symbol: "IVV", side: "BUY", qty: 4.8, price: 420.10, notional: 2016.48 },
  { symbol: "EEM", side: "BUY", qty: 52, price: 38.40, notional: 1996.80 },
  { symbol: "VGK", side: "BUY", qty: 26.5, price: 75.20, notional: 1992.80 },
  { symbol: "GLD", side: "BUY", qty: 10, price: 200.00, notional: 2000.00 },
  { symbol: "TLT", side: "BUY", qty: 21, price: 95.50, notional: 2005.50 },
  { symbol: "USO", side: "BUY", qty: 25, price: 80.20, notional: 2005.00 },
  { symbol: "GLDX", side: "BUY", qty: 44.5, price: 45.00, notional: 2002.50 },
  { symbol: "XLE", side: "BUY", qty: 23.5, price: 85.10, notional: 1999.85 },
  { symbol: "AAPL", side: "BUY", qty: 8.8, price: 228.00, notional: 2006.40 },
  { symbol: "MSFT", side: "BUY", qty: 4.8, price: 418.00, notional: 2006.40 },
  { symbol: "NVDA", side: "BUY", qty: 16, price: 125.00, notional: 2000.00 },
  { symbol: "BTC/USD", side: "BUY", qty: 0.032, price: 62500.00, notional: 2000.00 },
  { symbol: "EUR/USD", side: "BUY", qty: 1840, price: 1.0874, notional: 2000.82 },
];

async function runDay4Orders() {
  console.log("Submitting 15 Day 4 Test Orders (~$2,000 each)...");
  let filled = 0;
  const startTime = Date.now();

  for (let i = 0; i < DAY4_ORDERS.length; i++) {
    const item = DAY4_ORDERS[i];
    const orderPayload = {
      id: `DAY4-ORD-${i + 1}`,
      symbol: item.symbol,
      side: item.side,
      type: "MARKET",
      executionPrice: item.price,
      units: item.qty,
      notional: item.notional,
      margin: Math.round(item.notional / 5),
      leverage: 1,
    };

    const receipt = await routeOrderSubmission(orderPayload, {
      destination: "alpaca_paper",
      currentEquity: 50000,
      user: "TRADER-1",
    });

    if (receipt.status === "FILLED") {
      filled++;
      console.log(`  ✅ [${i + 1}/15] ${item.side} ${item.qty} ${item.symbol} FILLED @ $${item.price} (Notional: $${item.notional.toFixed(2)})`);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`\n✔ 15/15 Orders Processed in ${duration}ms (${filled} Filled).`);

  const chain = immutableAuditLog.verifyChainIntegrity();
  console.log(`✔ Cumulative SHA-256 Hash Chain: ${chain.valid ? "VALID ✅" : "INVALID ❌"} (${chain.count} total blocks)`);
}

runDay4Orders();
