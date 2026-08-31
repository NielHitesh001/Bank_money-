# templates/cointegration_pairs.py
# run: EUR/USD 1d
# name: Cointegration Statistical Arbitrage Spread

import numpy as np

trades = []
plots = {"spread": [], "zscore": [], "signal": []}

lookback = params.get("lookback", 60)
entry_z = params.get("entry_zscore", 1.8)
exit_z = params.get("exit_zscore", 0.25)
hedge_ratio = params.get("hedge_ratio", 1.042)

closes = df['close'].values
spread = []

for i in range(len(df)):
    ref_px = closes[0] * (1.0 + 0.0005 * i)
    s = closes[i] - hedge_ratio * ref_px
    spread.append(s)
    plots["spread"].append(s)

    if i >= lookback:
        slice_s = spread[i-lookback:i]
        mu = np.mean(slice_s)
        std = np.std(slice_s) or 1e-4
        z = (s - mu) / std
        plots["zscore"].append(z)

        # Stat-Arb entry/exit
        if z < -entry_z:
            plots["signal"].append(1) # Long spread
            if i + 5 < len(df):
                trades.append({
                    "entry_i": i,
                    "exit_i": i + 5,
                    "dir": "long",
                    "entry_price": df['open'].iloc[i+1],
                    "exit_price": df['open'].iloc[min(len(df)-1, i+6)],
                    "size": 10000
                })
        elif z > entry_z:
            plots["signal"].append(-1) # Short spread
        else:
            plots["signal"].append(0)
    else:
        plots["zscore"].append(0)
        plots["signal"].append(0)
