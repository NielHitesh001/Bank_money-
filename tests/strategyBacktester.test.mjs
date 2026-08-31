import test from "node:test";
import assert from "node:assert/strict";
import { STRATEGY_TEMPLATES, runQuantitativeBacktest } from "../src/services/backtesterEngine.js";

test("STRATEGY_TEMPLATES contains institutional baseline strategies", () => {
  assert.ok(STRATEGY_TEMPLATES.length >= 4, "Expected 4 strategy templates for pipeline paths");
  const kalmanTmpl = STRATEGY_TEMPLATES.find((t) => t.id === "kalman_regime");
  const garchTmpl = STRATEGY_TEMPLATES.find((t) => t.id === "garch_volatility");
  const cointTmpl = STRATEGY_TEMPLATES.find((t) => t.id === "cointegration_pairs");
  const mlTmpl = STRATEGY_TEMPLATES.find((t) => t.id === "ml_regime_blueprint");

  assert.ok(kalmanTmpl, "Kalman Filter strategy template required");
  assert.ok(garchTmpl, "GARCH Volatility strategy template required");
  assert.ok(cointTmpl, "Cointegration Stat-Arb strategy template required");
  assert.ok(mlTmpl, "ML Regime Classification strategy template required");
  assert.ok(kalmanTmpl.code.includes("on_bar"), "Strategy code must implement on_bar");
});

test("runQuantitativeBacktest computes valid Sharpe, Sortino, Drawdown, and Equity Curves", () => {
  const result = runQuantitativeBacktest(STRATEGY_TEMPLATES[0].code, {
    symbol: "EUR/USD",
    initialCapital: 100000,
    commission: 0.0005,
    slippage: 0.0002,
    barsCount: 60,
    preset: "kalman_regime",
  });

  assert.equal(result.symbol, "EUR/USD");
  assert.ok(result.finalEquity > 0, "Final equity must be positive");
  assert.ok(result.metrics.sharpeRatio > 0, "Sharpe ratio must be positive");
  assert.ok(result.metrics.sortinoRatio > 0, "Sortino ratio must be positive");
  assert.ok(result.metrics.maxDrawdownPct >= 0, "Max drawdown must be non-negative");
  assert.ok(Array.isArray(result.equityCurve), "Equity curve must be an array");
  assert.ok(result.equityCurve.length > 20, "Equity curve must have time-series data points");
  assert.ok(Array.isArray(result.trades), "Trades must be an array");
});

test("runQuantitativeBacktest simulates Kalman Filter trend regime strategy", () => {
  const result = runQuantitativeBacktest(STRATEGY_TEMPLATES[0].code, {
    symbol: "EUR/USD",
    initialCapital: 50000,
    preset: "kalman_regime",
  });

  assert.equal(result.symbol, "EUR/USD");
  assert.ok(result.equityCurve.length > 0);
  assert.ok(result.regimeDiagnostics.volatilityState);
});

test("runQuantitativeBacktest simulates Cointegration Stat-Arb Spread strategy", () => {
  const cointTmpl = STRATEGY_TEMPLATES.find((t) => t.id === "cointegration_pairs");
  const result = runQuantitativeBacktest(cointTmpl.code, {
    symbol: "EUR/USD",
    initialCapital: 100000,
    preset: "cointegration_pairs",
  });

  assert.ok(result.equityCurve.length > 0);
  assert.ok(result.metrics.sharpeRatio > 0);
});

test("runQuantitativeBacktest simulates ML Regime Blueprint strategy", () => {
  const mlTmpl = STRATEGY_TEMPLATES.find((t) => t.id === "ml_regime_blueprint");
  const result = runQuantitativeBacktest(mlTmpl.code, {
    symbol: "EUR/USD",
    initialCapital: 100000,
    preset: "ml_regime_blueprint",
  });

  assert.ok(result.equityCurve.length > 0);
  assert.ok(result.metrics.winRatePct >= 0);
});
