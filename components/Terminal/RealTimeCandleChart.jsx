import React, { useEffect, useMemo, useState } from "react";
import { wsMarketManager } from "../../src/services/wsManager.js";

function generateInitialCandles(basePrice, decimals = 4, count = 30) {
  const candles = [];
  let current = basePrice;
  const now = Date.now();
  const step = 60 * 1000;

  for (let i = count; i >= 0; i--) {
    const time = new Date(now - i * step);
    const timeStr = time.toTimeString().slice(0, 5);
    const vol = (Math.random() - 0.49) * 0.003 * current;
    const open = Number(current.toFixed(decimals));
    const close = Number((current + vol).toFixed(decimals));
    const high = Number((Math.max(open, close) + Math.random() * 0.0015 * current).toFixed(decimals));
    const low = Number((Math.min(open, close) - Math.random() * 0.0015 * current).toFixed(decimals));
    const volume = Math.floor(Math.random() * 25000) + 5000;

    candles.push({ time: timeStr, open, high, low, close, volume });
    current = close;
  }
  return candles;
}

export default function RealTimeCandleChart({ symbol = "EUR/USD" }) {
  const [timeframe, setTimeframe] = useState("1M");
  const [showSMA, setShowSMA] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [hoveredCandle, setHoveredCandle] = useState(null);

  const initialTicker = useMemo(() => wsMarketManager.getTicker(symbol) || { last: 1.0873, decimals: 4 }, [symbol]);
  const [candles, setCandles] = useState(() => generateInitialCandles(initialTicker.last, initialTicker.decimals || 4));

  // Listen for live ticks on selected symbol
  useEffect(() => {
    setCandles(generateInitialCandles(initialTicker.last, initialTicker.decimals || 4));

    const unsubscribe = wsMarketManager.subscribeSymbol(symbol, (tick) => {
      setCandles((prev) => {
        if (!prev.length) return prev;
        const lastCandle = { ...prev[prev.length - 1] };
        const price = tick.last;

        lastCandle.close = price;
        lastCandle.high = Math.max(lastCandle.high, price);
        lastCandle.low = Math.min(lastCandle.low, price);
        lastCandle.volume += 500;

        return [...prev.slice(0, -1), lastCandle];
      });
    });

    return () => unsubscribe();
  }, [symbol, initialTicker]);

  // Compute SMA 20 & RSI 14
  const technicals = useMemo(() => {
    const closes = candles.map((c) => c.close);
    const sma20 = closes.map((_, i, arr) => {
      if (i < 19) return null;
      const slice = arr.slice(i - 19, i + 1);
      return Number((slice.reduce((a, b) => a + b, 0) / 20).toFixed(initialTicker.decimals || 4));
    });

    // Simple RSI 14 calculation
    const rsi14 = closes.map((val, i, arr) => {
      if (i < 14) return 50;
      let gains = 0;
      let losses = 0;
      for (let j = i - 13; j <= i; j++) {
        const diff = arr[j] - arr[j - 1];
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
      }
      if (losses === 0) return 100;
      const rs = (gains / 14) / (losses / 14);
      return Number((100 - (100 / (1 + rs))).toFixed(1));
    });

    return { sma20, rsi14 };
  }, [candles, initialTicker.decimals]);

  // SVG Chart Geometry
  const chartWidth = 580;
  const chartHeight = 220;
  const rsiHeight = showRSI ? 60 : 0;
  const padding = { top: 15, right: 45, bottom: 25, left: 10 };

  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    const lows = candles.map((c) => c.low);
    const highs = candles.map((c) => c.high);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const range = max - min || 0.0001;
    return { minPrice: min - range * 0.05, maxPrice: max + range * 0.05, priceRange: range * 1.1 };
  }, [candles]);

  const candleWidth = (chartWidth - padding.left - padding.right) / candles.length;

  return (
    <div className="terminal-candle-panel">
      {/* Chart Header Bar */}
      <div className="candle-header">
        <div className="candle-title-group">
          <span className="eyebrow">REAL-TIME CANDLESTICK & TECHNICALS</span>
          <h3>{symbol}</h3>
        </div>

        <div className="candle-controls">
          <div className="timeframe-buttons">
            {["1M", "5M", "15M", "1H", "1D"].map((tf) => (
              <button
                key={tf}
                className={`tf-btn ${timeframe === tf ? "active" : ""}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="tech-toggles">
            <button
              className={`tech-toggle-btn ${showSMA ? "active" : ""}`}
              onClick={() => setShowSMA(!showSMA)}
            >
              SMA 20
            </button>
            <button
              className={`tech-toggle-btn ${showRSI ? "active" : ""}`}
              onClick={() => setShowRSI(!showRSI)}
            >
              RSI 14
            </button>
          </div>
        </div>
      </div>

      {/* Hover Info Bar */}
      <div className="candle-hover-info">
        {hoveredCandle ? (
          <>
            <span>TIME: <b>{hoveredCandle.time}</b></span>
            <span>O: <b>{hoveredCandle.open}</b></span>
            <span>H: <b>{hoveredCandle.high}</b></span>
            <span>L: <b>{hoveredCandle.low}</b></span>
            <span>C: <b>{hoveredCandle.close}</b></span>
            <span>VOL: <b>{(hoveredCandle.volume / 1000).toFixed(1)}k</b></span>
          </>
        ) : (
          <span>Hover over candles to inspect OHLCV parameters</span>
        )}
      </div>

      {/* Main SVG Candlestick Canvas */}
      <div className="candle-svg-container">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + rsiHeight}`}
          className="candle-svg"
          onMouseLeave={() => setHoveredCandle(null)}
        >
          {/* Price Gridlines */}
          {[0.25, 0.5, 0.75].map((pct, i) => {
            const y = padding.top + pct * (chartHeight - padding.top - padding.bottom);
            const price = maxPrice - pct * priceRange;
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#17221e" strokeDasharray="2 3" />
                <text x={chartWidth - padding.right + 6} y={y + 3} fill="#5d726c" fontSize="8" fontFamily="DM Mono">
                  {price.toFixed(initialTicker.decimals || 4)}
                </text>
              </g>
            );
          })}

          {/* Candlesticks */}
          {candles.map((c, i) => {
            const x = padding.left + i * candleWidth + candleWidth / 2;
            const openY = padding.top + ((maxPrice - c.open) / priceRange) * (chartHeight - padding.top - padding.bottom);
            const closeY = padding.top + ((maxPrice - c.close) / priceRange) * (chartHeight - padding.top - padding.bottom);
            const highY = padding.top + ((maxPrice - c.high) / priceRange) * (chartHeight - padding.top - padding.bottom);
            const lowY = padding.top + ((maxPrice - c.low) / priceRange) * (chartHeight - padding.top - padding.bottom);

            const isUp = c.close >= c.open;
            const color = isUp ? "#64dcb1" : "#ff5b6e";
            const bodyY = Math.min(openY, closeY);
            const bodyHeight = Math.max(Math.abs(closeY - openY), 1.5);

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredCandle(c)}
                style={{ cursor: "crosshair" }}
              >
                {/* Wick */}
                <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1" />
                {/* Body */}
                <rect
                  x={x - candleWidth * 0.35}
                  y={bodyY}
                  width={candleWidth * 0.7}
                  height={bodyHeight}
                  fill={color}
                  stroke={color}
                  strokeWidth="0.5"
                />
                {/* Volume bar at bottom */}
                <rect
                  x={x - candleWidth * 0.3}
                  y={chartHeight - padding.bottom - (c.volume / 30000) * 22}
                  width={candleWidth * 0.6}
                  height={(c.volume / 30000) * 22}
                  fill={color}
                  opacity="0.3"
                />
              </g>
            );
          })}

          {/* SMA 20 Line Overlay */}
          {showSMA && (
            <path
              d={technicals.sma20
                .map((val, i) => {
                  if (val === null) return "";
                  const x = padding.left + i * candleWidth + candleWidth / 2;
                  const y = padding.top + ((maxPrice - val) / priceRange) * (chartHeight - padding.top - padding.bottom);
                  return `${i === 19 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                })
                .filter(Boolean)
                .join(" ")}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
          )}

          {/* RSI 14 Sub-panel */}
          {showRSI && (
            <g transform={`translate(0, ${chartHeight})`}>
              <line x1={padding.left} y1="0" x2={chartWidth - padding.right} y2="0" stroke="#22352d" />
              {/* Overbought / Oversold thresholds */}
              <line x1={padding.left} y1="18" x2={chartWidth - padding.right} y2="18" stroke="#ff5b6e" strokeDasharray="2 2" strokeWidth="0.7" />
              <text x={chartWidth - padding.right + 6} y="21" fill="#ff5b6e" fontSize="7" fontFamily="DM Mono">70</text>
              <line x1={padding.left} y1="42" x2={chartWidth - padding.right} y2="42" stroke="#64dcb1" strokeDasharray="2 2" strokeWidth="0.7" />
              <text x={chartWidth - padding.right + 6} y="45" fill="#64dcb1" fontSize="7" fontFamily="DM Mono">30</text>

              {/* RSI Path */}
              <path
                d={technicals.rsi14
                  .map((val, i) => {
                    const x = padding.left + i * candleWidth + candleWidth / 2;
                    const y = 60 - (val / 100) * 60;
                    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#c084fc"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
