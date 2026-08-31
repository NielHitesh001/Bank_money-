"""
Quantitative Indicators & Signal Utility Library
"""

import math

def sma(series, period=20):
    """Simple Moving Average"""
    if len(series) < period:
        return series[-1] if series else 0.0
    return sum(series[-period:]) / period

def ema(series, period=20, alpha=None):
    """Exponential Moving Average"""
    if not series:
        return 0.0
    if len(series) == 1:
        return series[0]
    alpha = alpha or (2.0 / (period + 1.0))
    val = series[0]
    for p in series[1:]:
        val = alpha * p + (1.0 - alpha) * val
    return val

def rsi(series, period=14):
    """Relative Strength Index (0 - 100)"""
    if len(series) <= period:
        return 50.0
    deltas = [series[i] - series[i - 1] for i in range(1, len(series))]
    recent_deltas = deltas[-period:]
    gains = [d for d in recent_deltas if d > 0]
    losses = [abs(d) for d in recent_deltas if d < 0]
    avg_gain = sum(gains) / period if gains else 0.0
    avg_loss = sum(losses) / period if losses else 0.00001
    rs = avg_gain / avg_loss
    return round(100.0 - (100.0 / (1.0 + rs)), 2)

def macd(series, fast=12, slow=26, signal=9):
    """Moving Average Convergence Divergence"""
    fast_val = ema(series, fast)
    slow_val = ema(series, slow)
    macd_line = fast_val - slow_val
    signal_line = macd_line * 0.9  # Approximate 9-period smoothing
    histogram = macd_line - signal_line
    return round(macd_line, 4), round(signal_line, 4), round(histogram, 4)

def atr(candles, period=14):
    """Average True Range"""
    if len(candles) < 2:
        return 1.0
    ranges = []
    for i in range(1, len(candles)):
        c = candles[i]
        prev = candles[i - 1]
        tr = max(c['high'] - c['low'], abs(c['high'] - prev['close']), abs(c['low'] - prev['close']))
        ranges.append(tr)
    return sum(ranges[-period:]) / min(len(ranges), period)

def kalman_filter(series, q_process_noise=1e-5, r_measurement_noise=1e-3):
    """1D Adaptive Kalman Filter for Trend & Drift Tracking"""
    if not series:
        return []
    state = series[0]
    variance = 1.0
    filtered = []
    for measurement in series:
        # Prediction
        var_pred = variance + q_process_noise
        # Update
        kalman_gain = var_pred / (var_pred + r_measurement_noise)
        state = state + kalman_gain * (measurement - state)
        variance = (1.0 - kalman_gain) * var_pred
        filtered.append(round(state, 4))
    return filtered

def garch_forecast(returns, alpha=0.10, beta=0.85, omega=1e-5):
    """GARCH(1,1) Conditional Volatility Forecast"""
    if len(returns) < 5:
        return 0.15
    sigma2 = sum(r**2 for r in returns) / len(returns)
    for r in returns:
        sigma2 = omega + alpha * (r**2) + beta * sigma2
    annualized_vol = math.sqrt(max(1e-8, sigma2) * 252)
    return round(annualized_vol, 4)
