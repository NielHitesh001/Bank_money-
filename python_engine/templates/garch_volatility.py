# templates/garch_volatility.py
# run: NVDA 1d
# name: GARCH(1,1) Volatility Compression Arbitrage

import math
import numpy as np

trades = []
plots = {"volatility": [], "signal": []}

closes = df['close'].values
returns = np.diff(closes) / closes[:-1]

omega = 1e-5
alpha = 0.085
beta = 0.865

sigma2 = np.var(returns[:20]) if len(returns) >= 20 else 0.0004

for i in range(1, len(returns)):
    r = returns[i]
    sigma2 = omega + alpha * (r**2) + beta * sigma2
    ann_vol = math.sqrt(max(1e-8, sigma2) * 252)
    
    plots["volatility"].append(ann_vol)
    
    # Enter when volatility compresses before imminent breakout
    if ann_vol < 0.13:
        if i + 15 < len(df):
            trades.append({
                "entry_i": i,
                "exit_i": i + 15,
                "dir": "long",
                "entry_price": df['open'].iloc[i+1],
                "exit_price": df['open'].iloc[i+16],
                "size": 10000
            })
        plots["signal"].append(1)
    else:
        plots["signal"].append(0)
