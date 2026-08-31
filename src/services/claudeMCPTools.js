/**
 * Claude MCP Tool Registry & Client Dispatcher
 * Implements Anthropic Model Context Protocol schema for Systematic Trading IDE.
 */

export const STRATEGY_IDE_MCP_TOOLS = [
  {
    name: "run_backtest",
    description: "Execute backtest simulation on Python strategy code with honest slippage and commission accounting.",
    inputSchema: {
      type: "object",
      properties: {
        strategy_code: { type: "string", description: "Plain Python strategy code (strategy.py)" },
        symbol: { type: "string", description: "Target asset ticker, e.g. SPY, AAPL, EURUSD" },
        initial_capital: { type: "number", default: 100000 },
        commission: { type: "number", default: 0.0005 },
        slippage: { type: "number", default: 0.0002 },
        preset: { type: "string", enum: ["mean_reversion", "kalman_regime", "garch_volatility"] }
      },
      required: ["strategy_code", "symbol"]
    }
  },
  {
    name: "walk_forward",
    description: "Run rolling 5-fold cross-validation on strategy to verify out-of-sample efficiency and prevent overfitting.",
    inputSchema: {
      type: "object",
      properties: {
        strategy_code: { type: "string", description: "Python strategy code to test" },
        symbol: { type: "string", default: "SPY" },
        num_folds: { type: "integer", default: 5 },
        preset: { type: "string", default: "mean_reversion" }
      },
      required: ["strategy_code"]
    }
  },
  {
    name: "monte_carlo",
    description: "Resample executed trade sequences (500 permutations) for tail-drawdown analysis and risk-of-ruin calculation.",
    inputSchema: {
      type: "object",
      properties: {
        trades: { type: "array", description: "List of trade objects with pnl attribute" },
        num_simulations: { type: "integer", default: 500 },
        initial_capital: { type: "number", default: 100000 }
      },
      required: ["trades"]
    }
  },
  {
    name: "train_model",
    description: "Fit quantitative models locally: GARCH(1,1), Kalman Filter, HMM, LSTM Forecast, or Autoencoder.",
    inputSchema: {
      type: "object",
      properties: {
        model_type: { 
          type: "string", 
          enum: ["garch", "kalman", "hmm", "lstm", "autoencoder"],
          description: "Statistical model architecture to fit"
        },
        symbol: { type: "string", default: "SPY" },
        params: { type: "object", description: "Model hyperparameters" }
      },
      required: ["model_type", "symbol"]
    }
  },
  {
    name: "get_candles",
    description: "Fetch historical normalized OHLCV candles for any equity, FX, crypto, or macro series.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", default: "SPY" },
        timeframe: { type: "string", default: "1d" },
        lookback_days: { type: "integer", default: 90 }
      },
      required: ["symbol"]
    }
  },
  {
    name: "edit_strategy",
    description: "Validate Python AST syntax and save canonical strategy.py code to local workspace disk.",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Updated Python strategy code" }
      },
      required: ["code"]
    }
  },
  {
    name: "list_datasets",
    description: "List all local imported multi-asset datasets and macro time-series catalog.",
    inputSchema: { type: "object", properties: {} }
  }
];

export async function registerMCPTools() {
  try {
    const response = await fetch("/api/v1/assistant/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(STRATEGY_IDE_MCP_TOOLS)
    });
    return await response.json();
  } catch (err) {
    console.warn("MCP tools local fallback:", err.message);
    return { registered: true, count: STRATEGY_IDE_MCP_TOOLS.length };
  }
}
