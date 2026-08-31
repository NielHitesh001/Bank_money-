# templates/kalman_trend.py
# run: SPY 1d
# name: Kalman Filter Trend Regime Detector

import numpy as np

trades = []
plots = {"kalman": [], "signal": []}

lookback = params.get("lookback", 20)
kalman_gain = params.get("kalman_gain", 0.38)

state = df['close'].iloc[0]
variance = 1.0
q_noise = 1e-5
r_noise = 1e-3

for i in range(len(df)):
    measurement = df['close'].iloc[i]
    
    # State update
    var_pred = variance + q_noise
    gain = var_pred / (var_pred + r_noise)
    state = state + gain * (measurement - state)
    variance = (1.0 - gain) * var_pred
    
    plots["kalman"].append(state)
    
    # Trend drift signal
    if measurement > state * 1.008:
        if i + 10 < len(df):
            trades.append({
                "entry_i": i,
                "exit_i": i + 10,
                "dir": "long",
                "entry_price": df['open'].iloc[i+1],
                "exit_price": df['open'].iloc[i+11],
                "size": 10000
            })
        plots["signal"].append(1)
    else:
        plots["signal"].append(0)
