/**
 * Day 3 Order Execution Script
 * Submits 15 scaled test orders (~$500 notional each) across multi-asset instruments.
 */

import { routeOrderSubmission } from "../src/services/orderRouting.js";
import { immutableAuditLog } from "../src/services/auditLog/immutableAuditLog.js";

const DAY3_ORDERS = [
  { symbol: "SPY", side: "BUY", qty: 1, price: 580.25, notional: 580.25 },
  { symbol: "QQQ", side: "BUY", qty: 1.2, price: 425.50, notional: 510.60 },
  { symbol: "IVV", side: "BUY", qty: 1.2, price: 420.10, notional: 504.12 },
  { symbol: "EEM", side: "BUY", qty: 13, price: 38.40, notional: 499.20 },
  { symbol: "VGK", side: "BUY", qty: 6.5, price: 75.20, notional: 488.80 },
  { symbol: "GLD", side: "BUY", qty: 2.5, price: 200.00, notional: 500.00 },
  { symbol: "TLT", side: "BUY", qty: 5.2, price: 95.50, notional: 496.60 },
  { symbol: "USO", side: "BUY", qty: 6.2, price: 80.20, notional: 497.24 },
  { symbol: "GLDX", side: "BUY", qty: 11, price: 45.00, notional: 495.00 },
  { symbol: "XLE", side: "BUY", qty: 5.8, price: 85.10, notional: 493.58 },
  { symbol: "AAPL", side: "BUY", qty: 2.2, price: 228.00, notional: 501.60 },
  { symbol: "MSFT", side: "BUY", qty: 1.2, price: 418.00, notional: 501.60 },
  { symbol: "NVDA", side: "BUY", qty: 4, price: 125.00, notional: 500.00 },
  { symbol: "BTC/USD", side: "BUY", qty: 0.008, price: 62500.00, notional: 500.00 },
  { symbol: "EUR/USD", side: "BUY", qty: 460, price: 1.0874, notional: 500.20 },
];

async function runDay3Orders() {
  console.log("Submitting 15 Day 3 Test Orders (~$500 each)...");
  let filled = 0;
  const startTime = Date.now();

  for (let i = 0; i < DAY3_ORDERS.length; i++) {
    const item = DAY3_ORDERS[i];
    const orderPayload = {
      id: `DAY3-ORD-${i + 1}`,
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
      console.log(`  ✅ [${i + 1}/15] ${item.side} ${item.qty} ${item.symbol} FILLED @ $${item.price}`);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`\n✔ 15/15 Orders Processed in ${duration}ms (${filled} Filled).`);

  const chain = immutableAuditLog.verifyChainIntegrity();
  console.log(`✔ Cumulative SHA-256 Hash Chain: ${chain.valid ? "VALID ✅" : "INVALID ❌"} (${chain.count} total blocks)`);
}

runDay3Orders();
