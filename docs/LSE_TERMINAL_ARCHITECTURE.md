# 🎯 SYSTEMATIC TRADING IDE: COMPLETE ARCHITECTURE
## World Money Terminal OS + LSE Terminal Integration
**Date**: August 31, 2026 | **Status**: Design Phase → Implementation

---

## 📋 DESIGN PRINCIPLES (From LSE Terminal)

### 1. **Backtesting First**
- Charts exist to show markets and results.
- Centre of product: write strategy in Python, run on your data, read honest numbers.
- All strategies are plain Python files — nothing to import, no base class.

### 2. **Local-First, Privacy-By-Default**
- Everything runs on user's computer.
- Data files, strategies, notebooks stay on disk.
- Broker credentials never leave machine.
- Nothing leaves machine except when explicitly used.

### 3. **One Source of Truth**
- `strategy.py` is the canonical file.
- Backtester and live runner both use the same file.
- Lookbacks in days, engine converts to bars (works on 1h or 1d data).
- Pin line (`# run: EURUSD 1h`) names target dataset.

### 4. **AI as Collaborator**
- Model sees same screen user sees.
- Reads chart, runs backtest, edits file, runs again.
- Has tools: pull candles, run backtest, build datasets, train models.
- Shows work as it goes (tool calls, steps visible).

---

## 🏗️ TECHNICAL ARCHITECTURE (6-Layer Framework)

### Layer 1: Data Access Layer (Local-First)
- Import CSV, Parquet, TSV datasets with automatic header normalization.
- Direct broker feed adapter & historical bar loader.
- In-memory cache + lazy-loading across multi-asset series.

### Layer 2: Strategy Execution Engine
- Plain Python syntax (validated via AST parsing).
- Bar-by-bar execution loop with vectorization capabilities.
- Integrated indicator library: `sma`, `ema`, `rsi`, `macd`, `atr`, `kalman_filter`, `garch_forecast`.
- Event hooks: `on_bar(bar)` and `on_event(event)`.

### Layer 3: Backtesting & Performance Engine
- Honest execution simulation: bid/ask slippage & exchange commission accounting.
- Full equity curve tracking with peak-to-trough drawdown estimation.
- Institutional Metrics: Annualized Sharpe (252d), Sortino, 95%/99% VaR, Win Rate %, Profit Factor.
- Validation suites: Walk-forward rolling windows & Monte Carlo trade permutation tests.

### Layer 4: Quantitative Model Training Library
- **GARCH(1,1)**: Conditional heteroskedasticity & volatility clustering forecasting.
- **Kalman Filter**: Dynamic state-space trend & drift estimation.
- **Hidden Markov Model (HMM)**: Multi-regime market state transitions (Bull, Bear, Choppy).
- **LSTM Neural Network**: Multi-step sequential price & variance prediction.
- **Autoencoder**: High-dimensional price anomaly & structural break detection.

### Layer 5: Terminal IDE UI (React)
- Monaco Python Editor (`strategy.py`) with syntax highlighting & auto-save.
- Scorecard & Performance Analytics Panel.
- Interactive SVG Equity Curve with Buy & Hold benchmark overlay.
- Complete Executed Trades Blotter with P&L decomposition.
- Terminal Dock: Output Logs & Python Execution REPL.

### Layer 6: Claude MCP Protocol & AI Tools
- `run_backtest(strategy_code, symbol, dates, ...)`
- `get_candles(symbol, timeframe, lookback_days)`
- `train_model(model_type, data, params)`
- `build_ml_dataset(symbol, features, timeframe)`
- `get_economic_series(series_name, dates)`
- `edit_strategy(code)`
- `get_positions()` / `get_fills()`
- `walk_forward(strategy, param_grid, fold_size)`
- `monte_carlo(trades, num_samples)`

---

## 🔒 PRIVACY & SECURITY
- **100% Local Machine Execution**: All strategy code, backtests, and datasets remain exclusively on disk.
- **Zero Code Telemetry**: No user code or model parameters are ever sampled or sent to external servers.
- **Encrypted Credentials**: Broker API tokens stored in local AES-256-GCM vault.
