/**
 * Day 7 Order Execution Script (Final General Availability Validation)
 * Submits 25 scaled test orders (~$5,000 notional each = $125,000 notional batch).
 */

import { routeOrderSubmission } from "../src/services/orderRouting.js";
import { immutableAuditLog } from "../src/services/auditLog/immutableAuditLog.js";

const DAY7_ORDERS = [
  { symbol: "SPY", side: "BUY", qty: 8.6, price: 580.50, notional: 4992.30 },
  { symbol: "QQQ", side: "BUY", qty: 11.7, price: 426.00, notional: 4984.20 },
  { symbol: "IVV", side: "BUY", qty: 11.9, price: 420.50, notional: 5003.95 },
  { symbol: "EEM", side: "BUY", qty: 130, price: 38.50, notional: 5005.00 },
  { symbol: "VGK", side: "BUY", qty: 66.5, price: 75.30, notional: 5007.45 },
  { symbol: "GLD", side: "BUY", qty: 25, price: 200.20, notional: 5005.00 },
  { symbol: "TLT", side: "BUY", qty: 52.3, price: 95.60, notional: 4999.88 },
  { symbol: "USO", side: "BUY", qty: 62.2, price: 80.40, notional: 5000.88 },
  { symbol: "GLDX", side: "BUY", qty: 111, price: 45.10, notional: 5006.10 },
  { symbol: "XLE", side: "BUY", qty: 58.7, price: 85.20, notional: 5001.24 },
  { symbol: "AAPL", side: "BUY", qty: 21.9, price: 228.30, notional: 4999.77 },
  { symbol: "MSFT", side: "BUY", qty: 11.9, price: 418.50, notional: 4980.15 },
  { symbol: "NVDA", side: "BUY", qty: 39.8, price: 125.40, notional: 4990.92 },
  { symbol: "AMZN", side: "BUY", qty: 28.5, price: 175.50, notional: 5001.75 },
  { symbol: "GOOGL", side: "BUY", qty: 30.3, price: 165.00, notional: 4999.50 },
  { symbol: "META", side: "BUY", qty: 9.7, price: 515.00, notional: 4995.50 },
  { symbol: "TSLA", side: "BUY", qty: 23.8, price: 210.00, notional: 4998.00 },
  { symbol: "JPM", side: "BUY", qty: 22.8, price: 219.00, notional: 4993.20 },
  { symbol: "BAC", side: "BUY", qty: 125.0, price: 40.00, notional: 5000.00 },
  { symbol: "V", side: "BUY", qty: 18.0, price: 278.00, notional: 5004.00 },
  { symbol: "UNH", side: "BUY", qty: 8.5, price: 588.00, notional: 4998.00 },
  { symbol: "JNJ", side: "BUY", qty: 31.0, price: 161.00, notional: 4991.00 },
  { symbol: "BTC/USD", side: "BUY", qty: 0.08, price: 62500.00, notional: 5000.00 },
  { symbol: "ETH/USD", side: "BUY", qty: 1.85, price: 2700.00, notional: 4995.00 },
  { symbol: "EUR/USD", side: "BUY", qty: 4600, price: 1.0874, notional: 5002.04 },
];

async function runDay7Orders() {
  console.log("Submitting 25 Day 7 Test Orders (~$5,000 each = $125,000 Notional Final GA Approval)...");
  let filled = 0;
  const startTime = Date.now();

  for (let i = 0; i < DAY7_ORDERS.length; i++) {
    const item = DAY7_ORDERS[i];
    const orderPayload = {
      id: `DAY7-ORD-${i + 1}`,
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
      currentEquity: 100000,
      user: "TRADER-1",
    });

    if (receipt.status === "FILLED") {
      filled++;
      console.log(`  ✅ [${i + 1}/25] ${item.side} ${item.qty} ${item.symbol} FILLED @ $${item.price} (Notional: $${item.notional.toFixed(2)})`);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`\n✔ 25/25 Orders Processed in ${duration}ms (${filled} Filled).`);

  const chain = immutableAuditLog.verifyChainIntegrity();
  console.log(`✔ Cumulative SHA-256 Hash Chain: ${chain.valid ? "VALID ✅" : "INVALID ❌"} (${chain.count} total blocks)`);
}

runDay7Orders();
