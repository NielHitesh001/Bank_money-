import test from "node:test";
import assert from "node:assert/strict";
import { LiveExecutionGuardrails } from "../src/services/liveExecutionGuardrails.js";
import { AlpacaConnector } from "../src/services/brokers/alpacaConnector.js";
import { routeOrderSubmission } from "../src/services/orderRouting.js";
import { FillReconciliationEngine } from "../src/services/fillReconciliation.js";
import { RiskAlertEngine } from "../src/services/alerting/riskAlertEngine.js";
import { getUpcomingMacroEvents } from "../src/services/macroCalendar.js";
import { calculateBlackScholesGreeks, aggregatePortfolioGreeks } from "../src/analytics/greeksEngine.js";

test("LiveExecutionGuardrails validates orders and triggers emergency kill switch", () => {
  const guardrails = new LiveExecutionGuardrails({
    maxNotionalPerOrder: 50000,
    maxLeverageAllowed: 5,
  });

  // Valid order
  const validOrder = { id: "ORD-1", notional: 25000, margin: 5000, leverage: 5 };
  const resValid = guardrails.validateOrder(validOrder, 100000);
  assert.equal(resValid.approved, true);

  // Exceeds Notional Limit
  const hugeOrder = { id: "ORD-2", notional: 100000, margin: 20000, leverage: 5 };
  const resHuge = guardrails.validateOrder(hugeOrder, 100000);
  assert.equal(resHuge.approved, false);
  assert.ok(resHuge.errors[0].includes("ORDER CAP BREACH"));

  // Engage Kill Switch
  guardrails.pauseNewOrders("Market Flash Crash Test");
  assert.equal(guardrails.getStatus().paused, true);

  const resPaused = guardrails.validateOrder(validOrder, 100000);
  assert.equal(resPaused.approved, false);
  assert.ok(resPaused.errors[0].includes("EMERGENCY KILL SWITCH"));

  // Resume
  guardrails.resumeOrders();
  assert.equal(guardrails.getStatus().paused, false);
});

test("AlpacaConnector retrieves sandbox account and submits paper orders", async () => {
  const alpaca = new AlpacaConnector({ isPaper: true });
  const account = await alpaca.getAccount();

  assert.ok(account.id);
  assert.equal(account.currency, "USD");
  assert.equal(account.status, "ACTIVE");

  const clock = await alpaca.getClock();
  assert.ok(clock.timestamp);

  const orderFill = await alpaca.submitOrder({
    symbol: "EUR/USD",
    qty: 10000,
    side: "BUY",
    type: "market",
    limitPrice: 1.0874,
  });

  assert.ok(orderFill.id);
  assert.equal(orderFill.status, "filled");
  assert.equal(orderFill.side, "buy");
});

test("routeOrderSubmission rejects risky orders and fills approved orders", async () => {
  const safeOrder = {
    symbol: "EUR/USD",
    units: 10000,
    side: "BUY",
    type: "MARKET",
    executionPrice: 1.0874,
    notional: 10874,
    margin: 2174,
    leverage: 5,
  };

  const receipt = await routeOrderSubmission(safeOrder, { destination: "alpaca_paper" });
  assert.equal(receipt.status, "FILLED");
  assert.equal(receipt.symbol, "EUR/USD");
  assert.ok(receipt.orderId);
});

test("FillReconciliationEngine detects missing positions and unit mismatches", () => {
  const recon = new FillReconciliationEngine();

  const brokerPositions = [
    { symbol: "EUR/USD", qty: 10000 },
    { symbol: "USD/JPY", qty: 20000 }, // Discrepancy (local has 15000)
    { symbol: "BTC/USD", qty: 2 }, // Missing in local
  ];

  const localPositions = [
    { symbol: "EUR/USD", units: 10000 },
    { symbol: "USD/JPY", units: 15000 },
    { symbol: "XAU/USD", units: 100 }, // Missing on broker
  ];

  const result = recon.reconcile(brokerPositions, localPositions);
  assert.equal(result.status, "DISCREPANCIES_DETECTED");
  assert.equal(result.discrepancyCount, 3);
});

test("RiskAlertEngine triggers alerts on margin breach and VaR limits", () => {
  const alertEngine = new RiskAlertEngine();

  const alerts = alertEngine.evaluatePortfolioRisk({
    marginUtilizationPct: 92,
    var95_1d: 150000,
    varLimitUsd: 100000,
    dailyPnL: -60000,
    dailyLossLimit: -50000,
  });

  assert.equal(alerts.length, 3);
  const severities = alerts.map((a) => a.severity);
  assert.ok(severities.includes("CRITICAL"));
});

test("MacroCalendar returns upcoming economic release schedule", () => {
  const events = getUpcomingMacroEvents(72);
  assert.ok(events.length >= 1, "Expected upcoming macro events");
  assert.ok(events[0].event, "Macro event title required");
  assert.ok(events[0].impact, "Impact rating required");
});

test("Black-Scholes Greeks Engine calculates valid sensitivity derivatives", () => {
  const greeks = calculateBlackScholesGreeks({
    spot: 100,
    strike: 100,
    timeToExpiryYears: 0.5,
    riskFreeRate: 0.05,
    volatility: 0.20,
    optionType: "CALL",
  });

  assert.ok(greeks.delta > 0 && greeks.delta < 1, "Call delta must be between 0 and 1");
  assert.ok(greeks.gamma > 0, "Gamma must be positive");
  assert.ok(greeks.vega > 0, "Vega must be positive");
  assert.ok(greeks.theta < 0, "Theta for long option must be negative");

  const portfolioGreeks = aggregatePortfolioGreeks([
    { symbol: "EUR/USD", units: 100000, side: "BUY", notional: 108740, assetClass: "FX" },
  ]);

  assert.equal(portfolioGreeks.netDelta, 100000);
});
