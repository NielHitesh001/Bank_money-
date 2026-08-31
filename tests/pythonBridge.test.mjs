import test from "node:test";
import assert from "node:assert/strict";
import { pythonBridge } from "../src/services/pythonBridge.js";

test("pythonBridge executes run_backtest RPC successfully", async () => {
  const result = await pythonBridge.call("run_backtest", {
    symbol: "EUR/USD",
    initial_capital: 100000,
    preset: "kalman_regime",
  });

  assert.ok(result, "Expected backtest result object");
  assert.ok(result.finalEquity > 0, "Final equity should be > 0");
  assert.ok(result.metrics.sharpeRatio > 0, "Sharpe ratio should be positive");
  assert.ok(Array.isArray(result.equityCurve), "Equity curve should be an array");
});

test("pythonBridge executes walk_forward cross-validation", async () => {
  const result = await pythonBridge.call("walk_forward", {
    symbol: "EUR/USD",
    num_folds: 5,
    preset: "kalman_regime",
  });

  assert.ok(result.numFolds >= 4, "Expected at least 4 rolling folds");
  assert.ok(result.overallEfficiencyRatioPct > 0, "Expected positive efficiency ratio");
  assert.ok(Array.isArray(result.folds), "Folds must be an array");
});

test("pythonBridge executes monte_carlo permutation risk simulation", async () => {
  const result = await pythonBridge.call("monte_carlo", {
    trades: [{ pnl: 400 }, { pnl: -200 }, { pnl: 650 }, { pnl: -150 }],
    num_simulations: 1000,
  });

  assert.ok(result.medianDrawdownPct >= 0);
  assert.ok(result.p95DrawdownPct >= result.medianDrawdownPct);
  assert.ok(result.p99DrawdownPct >= result.p95DrawdownPct);
  assert.equal(typeof result.riskOfRuinPct, "number");
});

test("pythonBridge trains local quantitative model (GARCH)", async () => {
  const result = await pythonBridge.call("train_model", {
    model_type: "garch",
    symbol: "EUR/USD",
  });

  assert.equal(result.modelType, "GARCH(1,1)");
  assert.ok(result.annualizedVolPct > 0);
  assert.ok(result.regime);
});

test("pythonBridge trains local quantitative model (Cointegration ADF)", async () => {
  const result = await pythonBridge.call("train_model", {
    model_type: "cointegration",
    symbol: "EUR/USD",
  });

  assert.equal(result.modelType, "Engle-Granger Cointegration Test");
  assert.ok(typeof result.adfStatistic === "number");
  assert.ok(result.halfLifeBars > 0);
});

test("pythonBridge trains local quantitative model (ML Regime Blueprint)", async () => {
  const result = await pythonBridge.call("train_model", {
    model_type: "ml_regime",
    symbol: "EUR/USD",
  });

  assert.equal(result.modelType, "ML Regime Classification Blueprint");
  assert.ok(result.predictedRegime);
  assert.ok(result.rocAucScore > 0.70);
});

test.after(() => {
  pythonBridge.terminate();
});
