import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { wsMarketManager } from "../../src/services/wsManager.js";

const TIMEFRAME_CONFIG = {
  "1M": { count: 35, stepMs: 60 * 1000, label: "1-Minute" },
  "5M": { count: 40, stepMs: 5 * 60 * 1000, label: "5-Minute" },
  "15M": { count: 45, stepMs: 15 * 60 * 1000, label: "15-Minute" },
  "1H": { count: 30, stepMs: 60 * 60 * 1000, label: "1-Hour" },
  "1D": { count: 30, stepMs: 24 * 60 * 60 * 1000, label: "Daily" },
};

function generateRealisticCandles(basePrice, decimals = 2, timeframe = "1M") {
  const config = TIMEFRAME_CONFIG[timeframe] || TIMEFRAME_CONFIG["1M"];
  const candles = [];
  let current = Number(basePrice) || 100;
  const now = Date.now();

  for (let i = config.count; i >= 0; i--) {
    const time = new Date(now - i * config.stepMs);
    const timeStr = timeframe === "1D" 
      ? time.toISOString().slice(5, 10) 
      : time.toTimeString().slice(0, 5);

    const volatility = (Math.random() - 0.49) * 0.004 * current;
    const open = Number(current.toFixed(decimals));
    const close = Number((current + volatility).toFixed(decimals));
    const wickSpread = Math.random() * 0.002 * current;
    const high = Number((Math.max(open, close) + wickSpread).toFixed(decimals));
    const low = Number((Math.min(open, close) - wickSpread).toFixed(decimals));
    const volume = Math.floor(Math.random() * 45000) + 8000;

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
  const [dimensions, setDimensions] = useState({ width: 620, height: 260 });
  const containerRef = useRef(null);

  // Retrieve initial ticker metadata
  const ticker = useMemo(() => {
    return wsMarketManager.getTicker(symbol) || {
      symbol,
      name: symbol,
      last: symbol.includes("USD") && !symbol.includes("/") ? 580.25 : 1.0874,
      decimals: symbol.includes("JPY") || !symbol.includes("/") ? 2 : 4,
      pctChange: +0.45,
    };
  }, [symbol]);

  const [candles, setCandles] = useState(() => 
    generateRealisticCandles(ticker.last, ticker.decimals || 2, timeframe)
  );

  // Responsive container observer
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: Math.max(380, containerRef.current.clientWidth || 620),
          height: Math.max(220, containerRef.current.clientHeight || 260),
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Regenerate candles when symbol or timeframe changes
  useEffect(() => {
    const freshCandles = generateRealisticCandles(ticker.last, ticker.decimals || 2, timeframe);
    setCandles(freshCandles);

    const unsubscribe = wsMarketManager.subscribeSymbol(symbol, (tick) => {
      setCandles((prev) => {
        if (!prev || !prev.length) return prev;
        const lastCandle = { ...prev[prev.length - 1] };
        const price = tick.last;

        lastCandle.close = price;
        lastCandle.high = Math.max(lastCandle.high, price);
        lastCandle.low = Math.min(lastCandle.low, price);
        lastCandle.volume += Math.floor(Math.random() * 800) + 200;

        return [...prev.slice(0, -1), lastCandle];
      });
    });

    return () => unsubscribe();
  }, [symbol, timeframe, ticker]);

  // Technical Indicators: SMA 20 & RSI 14
  const technicals = useMemo(() => {
    const closes = candles.map((c) => c.close);
    const sma20 = closes.map((_, i, arr) => {
      if (i < 19) return null;
      const slice = arr.slice(i - 19, i + 1);
      return Number((slice.reduce((a, b) => a + b, 0) / 20).toFixed(ticker.decimals || 2));
    });

    const rsi14 = closes.map((_, i, arr) => {
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
  }, [candles, ticker.decimals]);

  // Chart Geometry
  const rsiHeight = showRSI ? 48 : 0;
  const padding = { top: 14, right: 55, bottom: 18, left: 10 };
  const mainChartHeight = showRSI ? 142 : 190;
  const chartWidth = Math.max(380, dimensions.width - 20);

  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (!candles.length) return { minPrice: 0, maxPrice: 1, priceRange: 1 };
    const lows = candles.map((c) => c.low);
    const highs = candles.map((c) => c.high);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const range = max - min || 0.01;
    return { 
      minPrice: min - range * 0.05, 
      maxPrice: max + range * 0.05, 
      priceRange: range * 1.1 
    };
  }, [candles]);

  const candleWidth = Math.max(4, (chartWidth - padding.left - padding.right) / (candles.length || 1));
  const latestPrice = candles[candles.length - 1]?.close || ticker.last;
  const priceChange = candles.length > 1 ? latestPrice - candles[0].open : 0;
  const priceChangePct = candles.length > 1 && candles[0].open > 0 ? (priceChange / candles[0].open) * 100 : 0;
  const isOverallUp = priceChange >= 0;

  return (
    <div ref={containerRef} className="terminal-candle-panel" style={{ width: "100%", height: "290px", maxHeight: "290px", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header Controls Bar */}
      <div className="candle-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px", marginBottom: "4px" }}>
        <div className="candle-title-group" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div>
            <span className="eyebrow" style={{ fontSize: "9px", color: "#64dcb1", letterSpacing: "0.5px" }}>
              LIVE TICKER STREAM
            </span>
            <h3 style={{ margin: 0, fontSize: "16px", color: "#f0fdf4", display: "flex", alignItems: "center", gap: "8px" }}>
              {symbol}
              <span style={{ fontSize: "13px", color: isOverallUp ? "#52d6aa" : "#ff5b6e" }}>
                ${latestPrice.toFixed(ticker.decimals || 2)} ({isOverallUp ? "+" : ""}{priceChangePct.toFixed(2)}%)
              </span>
            </h3>
          </div>
        </div>

        <div className="candle-controls" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="timeframe-buttons" style={{ display: "flex", gap: "2px" }}>
            {["1M", "5M", "15M", "1H", "1D"].map((tf) => (
              <button
                key={tf}
                className={`tf-btn ${timeframe === tf ? "active" : ""}`}
                onClick={() => setTimeframe(tf)}
                style={{ fontSize: "10px", padding: "2px 6px" }}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="tech-toggles" style={{ display: "flex", gap: "4px" }}>
            <button
              className={`tech-toggle-btn ${showSMA ? "active" : ""}`}
              onClick={() => setShowSMA(!showSMA)}
              style={{ fontSize: "10px", padding: "2px 6px" }}
            >
              SMA 20
            </button>
            <button
              className={`tech-toggle-btn ${showRSI ? "active" : ""}`}
              onClick={() => setShowRSI(!showRSI)}
              style={{ fontSize: "10px", padding: "2px 6px" }}
            >
              RSI 14
            </button>
          </div>
        </div>
      </div>

      {/* Hover OHLCV Status Strip */}
      <div className="candle-hover-info" style={{ fontSize: "10px", background: "#060a08", padding: "3px 8px", borderRadius: "3px", marginBottom: "4px", display: "flex", gap: "12px", color: "#8da49c" }}>
        {hoveredCandle ? (
          <>
            <span>TIME: <b style={{ color: "#f0fdf4" }}>{hoveredCandle.time}</b></span>
            <span>O: <b style={{ color: "#f0fdf4" }}>{hoveredCandle.open}</b></span>
            <span>H: <b style={{ color: "#52d6aa" }}>{hoveredCandle.high}</b></span>
            <span>L: <b style={{ color: "#ff5b6e" }}>{hoveredCandle.low}</b></span>
            <span>C: <b style={{ color: "#f0fdf4" }}>{hoveredCandle.close}</b></span>
            <span>VOL: <b style={{ color: "#76e2b5" }}>{(hoveredCandle.volume / 1000).toFixed(1)}k</b></span>
          </>
        ) : (
          <span>Hover over candles to inspect OHLCV parameters · Timeframe: {timeframe}</span>
        )}
      </div>

      {/* Responsive SVG Chart Canvas */}
      <div className="candle-svg-container" style={{ flex: 1, minHeight: "180px", position: "relative" }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${mainChartHeight + rsiHeight}`}
          className="candle-svg"
          style={{ width: "100%", height: "100%", display: "block" }}
          onMouseLeave={() => setHoveredCandle(null)}
        >
          {/* Price Gridlines */}
          {[0.2, 0.4, 0.6, 0.8].map((pct, i) => {
            const y = padding.top + pct * (mainChartHeight - padding.top - padding.bottom);
            const price = maxPrice - pct * priceRange;
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#13201a" strokeDasharray="2 3" />
                <text x={chartWidth - padding.right + 6} y={y + 3} fill="#5d726c" fontSize="9" fontFamily="DM Mono">
                  {price.toFixed(ticker.decimals || 2)}
                </text>
              </g>
            );
          })}

          {/* Candlesticks */}
          {candles.map((c, i) => {
            const x = padding.left + i * candleWidth + candleWidth / 2;
            const openY = padding.top + ((maxPrice - c.open) / priceRange) * (mainChartHeight - padding.top - padding.bottom);
            const closeY = padding.top + ((maxPrice - c.close) / priceRange) * (mainChartHeight - padding.top - padding.bottom);
            const highY = padding.top + ((maxPrice - c.high) / priceRange) * (mainChartHeight - padding.top - padding.bottom);
            const lowY = padding.top + ((maxPrice - c.low) / priceRange) * (mainChartHeight - padding.top - padding.bottom);

            const isUp = c.close >= c.open;
            const color = isUp ? "#52d6aa" : "#ff5b6e";
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
                {/* Candle Body */}
                <rect
                  x={x - candleWidth * 0.35}
                  y={bodyY}
                  width={Math.max(2, candleWidth * 0.7)}
                  height={bodyHeight}
                  fill={color}
                  stroke={color}
                  strokeWidth="0.5"
                />
                {/* Volume Bar */}
                <rect
                  x={x - candleWidth * 0.3}
                  y={mainChartHeight - padding.bottom - (c.volume / 50000) * 20}
                  width={Math.max(1, candleWidth * 0.6)}
                  height={(c.volume / 50000) * 20}
                  fill={color}
                  opacity="0.25"
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
                  const y = padding.top + ((maxPrice - val) / priceRange) * (mainChartHeight - padding.top - padding.bottom);
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
            <g transform={`translate(0, ${mainChartHeight})`}>
              <line x1={padding.left} y1="0" x2={chartWidth - padding.right} y2="0" stroke="#1a2c24" />
              {/* 70 Overbought line */}
              <line x1={padding.left} y1="15" x2={chartWidth - padding.right} y2="15" stroke="#ff5b6e" strokeDasharray="2 2" strokeWidth="0.7" />
              <text x={chartWidth - padding.right + 6} y="18" fill="#ff5b6e" fontSize="7" fontFamily="DM Mono">70</text>
              {/* 30 Oversold line */}
              <line x1={padding.left} y1="38" x2={chartWidth - padding.right} y2="38" stroke="#52d6aa" strokeDasharray="2 2" strokeWidth="0.7" />
              <text x={chartWidth - padding.right + 6} y="41" fill="#52d6aa" fontSize="7" fontFamily="DM Mono">30</text>

              {/* RSI Oscillating Path */}
              <path
                d={technicals.rsi14
                  .map((val, i) => {
                    const x = padding.left + i * candleWidth + candleWidth / 2;
                    const y = 50 - (val / 100) * 50;
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
