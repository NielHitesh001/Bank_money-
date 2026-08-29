import test from "node:test";
import assert from "node:assert/strict";
import { computeCarryTradeRankings } from "../src/analytics/fxCarryModel.js";
import { attributeTradePnL } from "../src/analytics/pnlAttribution.js";
import { calculatePortfolioVaR } from "../src/analytics/varRiskEngine.js";

test("computeCarryTradeRankings calculates valid yield spreads and signals", () => {
  const rankings = computeCarryTradeRankings();
  assert.ok(rankings.length >= 8, "Expected at least 8 currency carry pairs");

  rankings.forEach((item) => {
    assert.ok(item.pair, "Pair is required");
    assert.ok(typeof item.spread === "number");
    assert.ok(typeof item.carryToRisk === "number");
    assert.ok(["STRONG_CARRY", "MODERATE_CARRY", "NEUTRAL"].includes(item.signal));
  });

  // Verify sorting by carryToRisk descending
  for (let i = 0; i < rankings.length - 1; i++) {
    assert.ok(rankings[i].carryToRisk >= rankings[i + 1].carryToRisk, "Rankings should be sorted descending by carryToRisk");
  }
});

test("attributeTradePnL accurately decomposes Spot Delta, Carry, and Net PnL", () => {
  const position = {
    symbol: "EUR/USD",
    side: "BUY",
    entryPrice: 1.0800,
    units: 100000,
    margin: 21600,
    leverage: 5,
    carryRateAnnual: 2.0,
    holdingDays: 36.5,
    feePaid: 10,
  };

  const markPrice = 1.0850; // +50 pips
  const attribution = attributeTradePnL(position, markPrice);

  assert.equal(attribution.spotPnL, 500); // 100,000 * 0.0050 = +$500
  assert.ok(attribution.carryPnL > 0, "Carry PnL should be positive");
  assert.equal(attribution.fees, 10);
  assert.ok(attribution.netPnL > 490, "Net PnL should reflect spot + carry - fees");
});

test("calculatePortfolioVaR generates 95% and 99% VaR and stress test scenarios", () => {
  const positions = [
    { symbol: "EUR/USD", units: 100000, entryPrice: 1.08, assetClass: "FX" },
    { symbol: "SPX", units: 100, entryPrice: 5600, assetClass: "Indices" },
  ];

  const varMetrics = calculatePortfolioVaR(positions, 1000000);

  assert.ok(varMetrics.grossExposure > 0, "Gross exposure must be > 0");
  assert.ok(varMetrics.var95_1d > 0, "1-day 95% VaR must be > 0");
  assert.ok(varMetrics.var99_1d > varMetrics.var95_1d, "99% VaR must be greater than 95% VaR");
  assert.ok(varMetrics.var95_10d > varMetrics.var95_1d, "10-day VaR must be greater than 1-day VaR");
  assert.ok(varMetrics.stressScenarios.length >= 4, "Expected at least 4 stress scenarios");
});
