# templates/mean_reversion_rsi.py
# run: EURUSD 1h
# name: Mean Reversion (RSI + SMA)

import numpy as np

trades = []
plots = {"rsi": [], "signal": []}

fast_ma = params.get("fast", 9)
slow_ma = params.get("slow", 21)

for i in range(slow_ma, len(df)):
    close_window = df['close'].iloc[i-slow_ma+1:i+1].values
    
    # Indicators
    fast = np.mean(close_window[-fast_ma:])
    slow = np.mean(close_window)
    deltas = np.diff(close_window)
    gains = deltas[deltas > 0]
    losses = np.abs(deltas[deltas < 0])
    avg_gain = np.sum(gains) / len(deltas) if len(gains) > 0 else 0.0
    avg_loss = np.sum(losses) / len(deltas) if len(losses) > 0 else 1e-5
    rs = avg_gain / avg_loss
    rsi = 100.0 - (100.0 / (1.0 + rs))
    
    plots["rsi"].append(rsi)
    
    # Entry: Price below slow MA and RSI oversold
    if df['close'].iloc[i] < slow * 0.98 and rsi < 30:
        if i + 20 < len(df):
            trades.append({
                "entry_i": i,
                "exit_i": i + 20,
                "dir": "long",
                "entry_price": df['open'].iloc[i+1],
                "exit_price": df['open'].iloc[i+21],
                "size": 10000
            })
        plots["signal"].append(1)
    else:
        plots["signal"].append(0)
