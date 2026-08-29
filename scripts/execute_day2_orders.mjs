/**
 * Day 2 Order Execution Script
 * Submits the 10 planned test orders and records their cryptographic receipts.
 */

import { routeOrderSubmission } from "../src/services/orderRouting.js";
import { immutableAuditLog } from "../src/services/auditLog/immutableAuditLog.js";

const DAY2_ORDERS = [
  { symbol: "SPY", side: "BUY", qty: 1, price: 580.25, notional: 580.25 },
  { symbol: "QQQ", side: "BUY", qty: 1, price: 425.50, notional: 425.50 },
  { symbol: "IVV", side: "BUY", qty: 1, price: 420.10, notional: 420.10 },
  { symbol: "EEM", side: "BUY", qty: 0.5, price: 38.40, notional: 19.20 },
  { symbol: "VGK", side: "BUY", qty: 0.5, price: 75.20, notional: 37.60 },
  { symbol: "GLD", side: "BUY", qty: 1, price: 200.00, notional: 200.00 },
  { symbol: "TLT", side: "BUY", qty: 1, price: 95.50, notional: 95.50 },
  { symbol: "USO", side: "BUY", qty: 1, price: 80.20, notional: 80.20 },
  { symbol: "GLDX", side: "BUY", qty: 1, price: 45.00, notional: 45.00 },
  { symbol: "XLE", side: "BUY", qty: 1, price: 85.10, notional: 85.10 },
];

async function runDay2Orders() {
  console.log("Submitting 10 Day 2 Test Orders...");
  let filled = 0;
  const startTime = Date.now();

  for (let i = 0; i < DAY2_ORDERS.length; i++) {
    const item = DAY2_ORDERS[i];
    const orderPayload = {
      id: `DAY2-ORD-${i + 1}`,
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
      console.log(`  ✅ [${i + 1}/10] ${item.side} ${item.qty} ${item.symbol} FILLED @ $${item.price}`);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`\n✔ 10/10 Orders Processed in ${duration}ms (${filled} Filled).`);

  const chain = immutableAuditLog.verifyChainIntegrity();
  console.log(`✔ SHA-256 Hash Chain Integrity: ${chain.valid ? "VALID ✅" : "INVALID ❌"} (${chain.count} blocks)`);
}

runDay2Orders();
