import test from "node:test";
import assert from "node:assert/strict";
import { STRATEGY_TEMPLATES, runQuantitativeBacktest } from "../src/services/backtesterEngine.js";

test("STRATEGY_TEMPLATES contains institutional baseline strategies", () => {
  assert.ok(STRATEGY_TEMPLATES.length >= 3, "Expected at least 3 strategy templates");
  const meanRev = STRATEGY_TEMPLATES.find((t) => t.id === "mean_reversion");
  assert.ok(meanRev, "Mean reversion strategy template required");
  assert.ok(meanRev.code.includes("on_bar"), "Strategy code must implement on_bar");
});

test("runQuantitativeBacktest computes valid Sharpe, Sortino, Drawdown, and Equity Curves", () => {
  const result = runQuantitativeBacktest(STRATEGY_TEMPLATES[0].code, {
    symbol: "SPY",
    initialCapital: 100000,
    commission: 0.0005,
    slippage: 0.0002,
    barsCount: 60,
  });

  assert.equal(result.symbol, "SPY");
  assert.ok(result.finalEquity > 0, "Final equity must be positive");
  assert.ok(result.metrics.sharpeRatio > 0, "Sharpe ratio must be positive");
  assert.ok(result.metrics.sortinoRatio > 0, "Sortino ratio must be positive");
  assert.ok(result.metrics.maxDrawdownPct >= 0, "Max drawdown must be non-negative");
  assert.ok(Array.isArray(result.equityCurve), "Equity curve must be an array");
  assert.ok(result.equityCurve.length > 20, "Equity curve must have time-series data points");
  assert.ok(Array.isArray(result.trades), "Trades must be an array");
});

test("runQuantitativeBacktest simulates Kalman Filter trend regime strategy", () => {
  const result = runQuantitativeBacktest(STRATEGY_TEMPLATES[1].code, {
    symbol: "AAPL",
    initialCapital: 50000,
    preset: "kalman_regime",
  });

  assert.equal(result.symbol, "AAPL");
  assert.ok(result.equityCurve.length > 0);
  assert.ok(result.regimeDiagnostics.volatilityState);
});
