/**
 * Day 5 Order Execution Script (Consistency Check)
 * Submits 15 scaled test orders (~$2,000 notional each) across multi-asset instruments.
 */

import { routeOrderSubmission } from "../src/services/orderRouting.js";
import { immutableAuditLog } from "../src/services/auditLog/immutableAuditLog.js";

const DAY5_ORDERS = [
  { symbol: "SPY", side: "SELL", qty: 3.5, price: 581.10, notional: 2033.85 },
  { symbol: "QQQ", side: "SELL", qty: 4.7, price: 426.00, notional: 2002.20 },
  { symbol: "IVV", side: "SELL", qty: 4.8, price: 420.50, notional: 2018.40 },
  { symbol: "EEM", side: "SELL", qty: 52, price: 38.50, notional: 2002.00 },
  { symbol: "VGK", side: "SELL", qty: 26.5, price: 75.40, notional: 1998.10 },
  { symbol: "GLD", side: "SELL", qty: 10, price: 200.50, notional: 2005.00 },
  { symbol: "TLT", side: "SELL", qty: 21, price: 95.80, notional: 2011.80 },
  { symbol: "USO", side: "SELL", qty: 25, price: 80.50, notional: 2012.50 },
  { symbol: "GLDX", side: "SELL", qty: 44.5, price: 45.20, notional: 2011.40 },
  { symbol: "XLE", side: "SELL", qty: 23.5, price: 85.30, notional: 2004.55 },
  { symbol: "AAPL", side: "SELL", qty: 8.8, price: 228.50, notional: 2010.80 },
  { symbol: "MSFT", side: "SELL", qty: 4.8, price: 419.00, notional: 2011.20 },
  { symbol: "NVDA", side: "SELL", qty: 16, price: 125.50, notional: 2008.00 },
  { symbol: "BTC/USD", side: "SELL", qty: 0.032, price: 62800.00, notional: 2009.60 },
  { symbol: "EUR/USD", side: "SELL", qty: 1840, price: 1.0880, notional: 2001.92 },
];

async function runDay5Orders() {
  console.log("Submitting 15 Day 5 Test Orders (~$2,000 each - Consistency Check)...");
  let filled = 0;
  const startTime = Date.now();

  for (let i = 0; i < DAY5_ORDERS.length; i++) {
    const item = DAY5_ORDERS[i];
    const orderPayload = {
      id: `DAY5-ORD-${i + 1}`,
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

runDay5Orders();
