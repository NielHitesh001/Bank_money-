# 🚀 STRATEGY IDE: QUICK START GUIDE
## Write Strategies in Plain Python. Run Backtests. Get Honest Numbers.

---

## ✍️ 5-MINUTE FIRST STRATEGY

1. Navigate to the **`💻 STRATEGY IDE (AI QUANT)`** desk tab (or type `IDE <GO>`).
2. Select the **Mean Reversion (RSI + SMA)** template from the dropdown.
3. Click **`⚡ RUN BACKTEST`**.
4. Inspect the **Annualized Sharpe**, **Max Drawdown**, and interactive **Equity Curve**.
5. Ask the embedded **AI Quant Copilot**: *"Add Kalman filter trend detection"* or *"Add an ATR trailing stop"*.
6. Click **`⚡ Apply Code to Editor`** and re-run!

---

## 📊 INTERPRETING BACKTEST METRICS

| Metric | Benchmark Target | Description |
|---|---|---|
| **Sharpe Ratio** | $>1.50$ | Excess annualized return generated per unit of total volatility ($252\text{d}$). |
| **Sortino Ratio** | $>2.00$ | Excess return per unit of *downside* variance only. |
| **Max Drawdown** | $<15\%$ | Maximum peak-to-trough equity reduction during the simulation window. |
| **Win Rate %** | $>55\%$ | Percentage of filled positions closing with positive net P&L. |
| **Profit Factor** | $>1.50\text{x}$ | Gross aggregate profit divided by gross aggregate loss. |

---

## 📚 BUILT-IN INDICATORS AVAILABLE

- **Trend**: `sma(data, period)`, `ema(data, period)`, `kalman_filter(data)`
- **Momentum**: `rsi(data, period)`, `macd(data)`, `momentum(data, period)`
- **Volatility**: `atr(data, period)`, `bollinger_bands(data, period, std)`, `garch_forecast(returns)`
