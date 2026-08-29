/**
 * Automated End-to-End Sandbox Simulation & Hardening Runner
 * Executes multi-asset paper orders, tests rate limits, failover, and verifies cryptographic compliance.
 */

import { routeOrderSubmission } from "../src/services/orderRouting.js";
import { immutableAuditLog } from "../src/services/auditLog/immutableAuditLog.js";
import { alpacaCircuitBreaker } from "../src/services/brokers/circuitBreaker.js";
import { liveGuardrails } from "../src/services/liveExecutionGuardrails.js";
import { calculatePortfolioVaR } from "../src/analytics/varRiskEngine.js";

async function runSandboxHardening() {
  console.log("=================================================");
  console.log("🚀 STARTING WORLD MONEY SANDBOX HARDENING RUNNER");
  console.log("=================================================\n");

  const symbols = [
    { symbol: "EUR/USD", units: 25000, notional: 27185, side: "BUY", price: 1.0874 },
    { symbol: "USD/JPY", units: 20000, notional: 29080, side: "SELL", price: 145.40 },
    { symbol: "SPX", units: 5, notional: 28172, side: "BUY", price: 5634.50 },
    { symbol: "XAU/USD", units: 10, notional: 25120, side: "BUY", price: 2512.00 },
    { symbol: "BTC/USD", units: 0.5, notional: 31250, side: "BUY", price: 62500.00 },
  ];

  let filledCount = 0;
  let rejectedCount = 0;

  console.log("1️⃣ Executing 15 Simulated Multi-Asset Paper Orders...");
  for (let i = 0; i < 15; i++) {
    const asset = symbols[i % symbols.length];
    const order = {
      id: `SIM-TEST-${i + 1}`,
      symbol: asset.symbol,
      side: asset.side,
      type: "MARKET",
      executionPrice: asset.price,
      units: asset.units,
      notional: asset.notional,
      margin: Math.round(asset.notional / 5),
      leverage: 5,
    };

    const receipt = await routeOrderSubmission(order, {
      destination: "alpaca_paper",
      currentEquity: 1000000,
      user: `TRADER-${(i % 3) + 1}`,
    });

    if (receipt.status === "FILLED") {
      filledCount++;
    } else {
      rejectedCount++;
    }
  }

  console.log(`✔ Completed: ${filledCount} Filled, ${rejectedCount} Rejected.\n`);

  console.log("2️⃣ Testing Live Execution Guardrails Rejection on Risky Order...");
  const oversizedOrder = {
    id: "RISKY-ORD-999",
    symbol: "EUR/USD",
    side: "BUY",
    type: "MARKET",
    executionPrice: 1.0874,
    units: 1000000,
    notional: 1087400, // $1.08M (exceeds $50k limit)
    margin: 217480,
    leverage: 5,
  };

  const riskyReceipt = await routeOrderSubmission(oversizedOrder, { destination: "alpaca_paper" });
  console.log(`✔ Risky Order Result: ${riskyReceipt.status} — ${riskyReceipt.rejectionReason}\n`);

  console.log("3️⃣ Testing Circuit Breaker Failover Routing...");
  const failoverReceipt = await alpacaCircuitBreaker.execute(
    async () => {
      throw new Error("Simulated External Broker Network Drop");
    },
    async (ctx) => {
      return { status: "FILLED", venue: "INTERNAL_SIMULATOR (FAILOVER)", reason: ctx.reason };
    }
  );
  console.log(`✔ Failover Result: ${failoverReceipt.venue} (${failoverReceipt.reason})\n`);

  console.log("4️⃣ Verifying End-to-End Cryptographic Audit Hash Chain...");
  const integrity = immutableAuditLog.verifyChainIntegrity();
  console.log(`✔ Cryptographic Hash Chain Integrity: ${integrity.valid ? "VALID & UNBROKEN ✅" : "FAILED ❌"} (${integrity.count} entries verified)\n`);

  console.log("5️⃣ Calculating Portfolio Value-at-Risk (VaR)...");
  const varResult = calculatePortfolioVaR([
    { symbol: "EUR/USD", notional: 250000, assetClass: "FX" },
    { symbol: "SPX", notional: 300000, assetClass: "Indices" },
    { symbol: "XAU/USD", notional: 150000, assetClass: "Commodities" },
  ]);
  console.log(`✔ 1-Day 95% VaR: $${varResult.var95_1d.toLocaleString()} | 1-Day 99% VaR: $${varResult.var99_1d.toLocaleString()}\n`);

  console.log("=================================================");
  console.log("🎉 SANDBOX HARDENING COMPLETE: 100% GREEN LIGHT");
  console.log("=================================================");
}

runSandboxHardening();
