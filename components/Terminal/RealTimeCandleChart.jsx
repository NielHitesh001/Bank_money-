import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { wsMarketManager } from "../../src/services/wsManager.js";

// ============================================================================
// Technical Indicator Algorithms (Zerodha Kite / TradingView Standards)
// ============================================================================

function calculateSMA(values, period) {
  const result = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = values.slice(i - period + 1, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / period;
      result.push(avg);
    }
  }
  return result;
}

function calculateEMA(values, period) {
  const result = [];
  const k = 2 / (period + 1);
  let prevEMA = null;

  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (i < period - 1) {
      result.push(null);
    } else if (prevEMA === null) {
      const slice = values.slice(0, period);
      prevEMA = slice.reduce((a, b) => a + b, 0) / period;
      result.push(prevEMA);
    } else {
      prevEMA = val * k + prevEMA * (1 - k);
      result.push(prevEMA);
    }
  }
  return result;
}

function calculateBollingerBands(values, period = 20, multiplier = 2) {
  const middle = calculateSMA(values, period);
  const upper = [];
  const lower = [];

  for (let i = 0; i < values.length; i++) {
    if (middle[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = values.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const variance = slice.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      upper.push(mean + multiplier * stdDev);
      lower.push(mean - multiplier * stdDev);
    }
  }
  return { upper, middle, lower };
}

function calculateRSI(values, period = 14) {
  const result = [];
  let gains = [];
  let losses = [];

  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  for (let i = 0; i < values.length; i++) {
    if (i < period) {
      result.push(50);
    } else {
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);
        result.push(Number(rsi.toFixed(1)));
      }
    }
  }
  return result;
}

function calculateMACD(values, fast = 12, slow = 26, signal = 9) {
  const emaFast = calculateEMA(values, fast);
  const emaSlow = calculateEMA(values, slow);
  const macdLine = [];

  for (let i = 0; i < values.length; i++) {
    if (emaFast[i] !== null && emaSlow[i] !== null) {
      macdLine.push(emaFast[i] - emaSlow[i]);
    } else {
      macdLine.push(0);
    }
  }

  const signalLine = calculateEMA(macdLine, signal);
  const histogram = macdLine.map((val, i) => (signalLine[i] !== null ? val - signalLine[i] : 0));

  return { macdLine, signalLine, histogram };
}

function convertToHeikinAshi(candles) {
  if (!candles || candles.length === 0) return [];
  const haCandles = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? (c.open + c.close) / 2 : (haCandles[i - 1].open + haCandles[i - 1].close) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    haCandles.push({
      ...c,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
    });
  }
  return haCandles;
}

// Generate full-width continuous realistic candle series
function generateFullWidthCandles(basePrice, decimals = 2, count = 55, timeframe = "1M") {
  const candles = [];
  let current = Number(basePrice) || 100;
  const now = Date.now();
  const stepMs = timeframe === "1D" ? 86400000 : timeframe === "1H" ? 3600000 : timeframe === "15M" ? 900000 : timeframe === "5M" ? 300000 : 60000;

  for (let i = count; i >= 0; i--) {
    const time = new Date(now - i * stepMs);
    const timeStr = timeframe === "1D" 
      ? time.toISOString().slice(5, 10) 
      : time.toTimeString().slice(0, 5);

    const volatility = (Math.random() - 0.49) * 0.0035 * current;
    const open = Number(current.toFixed(decimals));
    const close = Number((current + volatility).toFixed(decimals));
    const wickSpread = Math.random() * 0.002 * current;
    const high = Number((Math.max(open, close) + wickSpread).toFixed(decimals));
    const low = Number((Math.min(open, close) - wickSpread).toFixed(decimals));
    const volume = Math.floor(Math.random() * 65000) + 12000;

    candles.push({ time: timeStr, timestamp: time.getTime(), open, high, low, close, volume });
    current = close;
  }
  return candles;
}

export default function RealTimeCandleChart({ symbol = "EUR/USD" }) {
  const [timeframe, setTimeframe] = useState("1M");
  const [chartType, setChartType] = useState("CANDLE"); // "CANDLE" | "HEIKIN" | "AREA"
  const [activeIndicators, setActiveIndicators] = useState({
    ema9: true,
    ema21: true,
    bb: false,
    rsi: true,
    macd: false,
  });

  const [mousePos, setMousePos] = useState(null);
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [containerWidth, setContainerWidth] = useState(700);
  const containerRef = useRef(null);
  const svgRef = useRef(null);

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

  // Responsive width observer
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(Math.max(420, containerRef.current.clientWidth));
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute number of candles to fill 100% of the container width without empty space
  const candleCount = useMemo(() => {
    return Math.max(40, Math.min(80, Math.floor((containerWidth - 65) / 12)));
  }, [containerWidth]);

  const [rawCandles, setRawCandles] = useState(() => 
    generateFullWidthCandles(ticker.last, ticker.decimals || 2, candleCount, timeframe)
  );

  // Reset candle series on symbol or timeframe change
  useEffect(() => {
    setRawCandles(generateFullWidthCandles(ticker.last, ticker.decimals || 2, candleCount, timeframe));

    const unsubscribe = wsMarketManager.subscribeSymbol(symbol, (tick) => {
      setRawCandles((prev) => {
        if (!prev || prev.length === 0) return prev;
        const lastCandle = { ...prev[prev.length - 1] };
        const price = tick.last;

        lastCandle.close = price;
        lastCandle.high = Math.max(lastCandle.high, price);
        lastCandle.low = Math.min(lastCandle.low, price);
        lastCandle.volume += Math.floor(Math.random() * 600) + 150;

        return [...prev.slice(0, -1), lastCandle];
      });
    });

    return () => unsubscribe();
  }, [symbol, timeframe, candleCount, ticker]);

  // Active display candles based on Chart Type (Candle vs Heikin Ashi)
  const displayCandles = useMemo(() => {
    if (chartType === "HEIKIN") {
      return convertToHeikinAshi(rawCandles);
    }
    return rawCandles;
  }, [rawCandles, chartType]);

  // Technical Indicator Series
  const closes = useMemo(() => displayCandles.map((c) => c.close), [displayCandles]);
  const ema9 = useMemo(() => calculateEMA(closes, 9), [closes]);
  const ema21 = useMemo(() => calculateEMA(closes, 21), [closes]);
  const bb = useMemo(() => calculateBollingerBands(closes, 20, 2), [closes]);
  const rsi = useMemo(() => calculateRSI(closes, 14), [closes]);
  const macd = useMemo(() => calculateMACD(closes, 12, 26, 9), [closes]);

  // Dimensions & Geometry
  const totalHeight = 290;
  const showSubPanel = activeIndicators.rsi || activeIndicators.macd;
  const subPanelHeight = showSubPanel ? 50 : 0;
  const padding = { top: 18, right: 60, bottom: 20, left: 12 };
  const mainChartHeight = totalHeight - 65 - subPanelHeight;
  const chartWidth = containerWidth;

  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (!displayCandles.length) return { minPrice: 0, maxPrice: 1, priceRange: 1 };
    const lows = displayCandles.map((c) => c.low);
    const highs = displayCandles.map((c) => c.high);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const range = max - min || 0.01;
    return {
      minPrice: min - range * 0.06,
      maxPrice: max + range * 0.06,
      priceRange: range * 1.12,
    };
  }, [displayCandles]);

  const maxVolume = useMemo(() => {
    return Math.max(...displayCandles.map((c) => c.volume), 50000);
  }, [displayCandles]);

  const candleSlotWidth = (chartWidth - padding.left - padding.right) / Math.max(1, displayCandles.length);
  const candleBodyWidth = Math.max(3, candleSlotWidth * 0.68);

  const latestCandle = displayCandles[displayCandles.length - 1] || { close: ticker.last, open: ticker.last };
  const currentLTP = latestCandle.close;
  const priceChange = displayCandles.length > 1 ? currentLTP - displayCandles[0].open : 0;
  const priceChangePct = displayCandles.length > 1 && displayCandles[0].open > 0 ? (priceChange / displayCandles[0].open) * 100 : 0;
  const isPos = priceChange >= 0;

  // Active inspected candle (Hovered or Latest)
  const activeCandle = hoveredCandle || latestCandle;
  const candleDelta = (activeCandle.close - activeCandle.open);
  const candleDeltaPct = activeCandle.open > 0 ? (candleDelta / activeCandle.open) * 100 : 0;

  // Track Mouse for Zerodha-Style Interactive Crosshairs
  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < padding.left || x > chartWidth - padding.right || y < padding.top || y > mainChartHeight + subPanelHeight) {
      setMousePos(null);
      setHoveredCandle(null);
      return;
    }

    setMousePos({ x, y });

    // Calculate nearest candle index
    const relX = x - padding.left;
    const index = Math.min(displayCandles.length - 1, Math.max(0, Math.floor(relX / candleSlotWidth)));
    setHoveredCandle(displayCandles[index]);
  }, [chartWidth, padding.left, padding.right, padding.top, mainChartHeight, subPanelHeight, candleSlotWidth, displayCandles]);

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
    setHoveredCandle(null);
  }, []);

  const currentLtpY = padding.top + ((maxPrice - currentLTP) / priceRange) * (mainChartHeight - padding.top - padding.bottom);
  const hoveredPrice = mousePos ? maxPrice - ((mousePos.y - padding.top) / (mainChartHeight - padding.top - padding.bottom)) * priceRange : null;

  return (
    <div ref={containerRef} className="terminal-candle-panel" style={{ width: "100%", height: "290px", maxHeight: "290px", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden", background: "#060807" }}>
      {/* Top Zerodha-Style Header Ribbon */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: "#0c100e", borderBottom: "1px solid #192721" }}>
        {/* Left: Symbol & Live Tick */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "14px", fontWeight: "bold", color: "#f0fdf4", letterSpacing: "0.5px" }}>
              {symbol}
            </span>
            <span style={{ fontSize: "13px", fontWeight: "bold", color: isPos ? "#00cc33" : "#ff3333" }}>
              ${currentLTP.toFixed(ticker.decimals || 2)}
            </span>
            <span style={{ fontSize: "10px", color: isPos ? "#00cc33" : "#ff3333" }}>
              ({isPos ? "+" : ""}{priceChangePct.toFixed(2)}%)
            </span>
          </div>

          {/* Chart Type Toggle */}
          <div style={{ display: "flex", background: "#050807", border: "1px solid #192721", borderRadius: "3px", padding: "1px" }}>
            <button
              onClick={() => setChartType("CANDLE")}
              style={{ background: chartType === "CANDLE" ? "#1b3327" : "transparent", color: chartType === "CANDLE" ? "#64dcb1" : "#666", border: "none", fontSize: "9px", padding: "2px 6px", cursor: "pointer", borderRadius: "2px" }}
              title="Candlestick Chart"
            >
              🕯️ Candles
            </button>
            <button
              onClick={() => setChartType("HEIKIN")}
              style={{ background: chartType === "HEIKIN" ? "#1b3327" : "transparent", color: chartType === "HEIKIN" ? "#64dcb1" : "#666", border: "none", fontSize: "9px", padding: "2px 6px", cursor: "pointer", borderRadius: "2px" }}
              title="Heikin-Ashi Smoothed Trend"
            >
              📊 Heikin
            </button>
            <button
              onClick={() => setChartType("AREA")}
              style={{ background: chartType === "AREA" ? "#1b3327" : "transparent", color: chartType === "AREA" ? "#64dcb1" : "#666", border: "none", fontSize: "9px", padding: "2px 6px", cursor: "pointer", borderRadius: "2px" }}
              title="Mountain Area Chart"
            >
              📈 Area
            </button>
          </div>
        </div>

        {/* Center/Right: Timeframe + Indicators Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Timeframes */}
          <div style={{ display: "flex", gap: "2px" }}>
            {["1M", "5M", "15M", "1H", "1D"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  background: timeframe === tf ? "#00d9ff" : "#090f0c",
                  color: timeframe === tf ? "#050807" : "#777",
                  border: "1px solid #1a2c24",
                  fontSize: "9px",
                  fontWeight: timeframe === tf ? "bold" : "normal",
                  padding: "2px 5px",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicators Toolbar */}
          <div style={{ display: "flex", gap: "3px", borderLeft: "1px solid #1b2f25", paddingLeft: "6px" }}>
            <button
              onClick={() => setActiveIndicators((prev) => ({ ...prev, ema9: !prev.ema9 }))}
              style={{ background: activeIndicators.ema9 ? "#0e2d36" : "transparent", color: activeIndicators.ema9 ? "#38bdf8" : "#555", border: "1px solid #18333c", fontSize: "9px", padding: "1px 5px", borderRadius: "2px", cursor: "pointer" }}
            >
              EMA 9
            </button>
            <button
              onClick={() => setActiveIndicators((prev) => ({ ...prev, ema21: !prev.ema21 }))}
              style={{ background: activeIndicators.ema21 ? "#332310" : "transparent", color: activeIndicators.ema21 ? "#fb923c" : "#555", border: "1px solid #3d2915", fontSize: "9px", padding: "1px 5px", borderRadius: "2px", cursor: "pointer" }}
            >
              EMA 21
            </button>
            <button
              onClick={() => setActiveIndicators((prev) => ({ ...prev, bb: !prev.bb }))}
              style={{ background: activeIndicators.bb ? "#152438" : "transparent", color: activeIndicators.bb ? "#60a5fa" : "#555", border: "1px solid #1c324e", fontSize: "9px", padding: "1px 5px", borderRadius: "2px", cursor: "pointer" }}
            >
              BB(20,2)
            </button>
            <button
              onClick={() => setActiveIndicators((prev) => ({ ...prev, rsi: !prev.rsi }))}
              style={{ background: activeIndicators.rsi ? "#2a1538" : "transparent", color: activeIndicators.rsi ? "#c084fc" : "#555", border: "1px solid #361b47", fontSize: "9px", padding: "1px 5px", borderRadius: "2px", cursor: "pointer" }}
            >
              RSI 14
            </button>
          </div>
        </div>
      </div>

      {/* Floating HUD Bar (Zerodha-Style OHLCV details) */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "2px 8px", background: "#050807", fontSize: "9px", fontFamily: "DM Mono, monospace", color: "#799288", borderBottom: "1px solid #111a16" }}>
        <span>TIME: <b style={{ color: "#f0fdf4" }}>{activeCandle.time}</b></span>
        <span>O: <b style={{ color: "#f0fdf4" }}>{activeCandle.open.toFixed(ticker.decimals || 2)}</b></span>
        <span>H: <b style={{ color: "#00cc33" }}>{activeCandle.high.toFixed(ticker.decimals || 2)}</b></span>
        <span>L: <b style={{ color: "#ff3333" }}>{activeCandle.low.toFixed(ticker.decimals || 2)}</b></span>
        <span>C: <b style={{ color: "#f0fdf4" }}>{activeCandle.close.toFixed(ticker.decimals || 2)}</b></span>
        <span>CHANGE: <b style={{ color: candleDelta >= 0 ? "#00cc33" : "#ff3333" }}>{candleDelta >= 0 ? "+" : ""}{candleDelta.toFixed(ticker.decimals || 2)} ({candleDeltaPct.toFixed(2)}%)</b></span>
        <span>VOL: <b style={{ color: "#38bdf8" }}>{(activeCandle.volume / 1000).toFixed(1)}K</b></span>
        {activeIndicators.rsi && rsi[rsi.length - 1] && (
          <span style={{ marginLeft: "auto", color: "#c084fc" }}>
            RSI(14): <b>{rsi[rsi.length - 1]}</b>
          </span>
        )}
      </div>

      {/* Interactive SVG Chart Canvas */}
      <div style={{ flex: 1, minHeight: 0, position: "relative", cursor: "crosshair" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartWidth} ${mainChartHeight + subPanelHeight}`}
          style={{ width: "100%", height: "100%", display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Subtle Gridlines */}
          {[0.2, 0.4, 0.6, 0.8].map((pct, i) => {
            const y = padding.top + pct * (mainChartHeight - padding.top - padding.bottom);
            const p = maxPrice - pct * priceRange;
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#111c17" strokeDasharray="2 3" />
                <text x={chartWidth - padding.right + 6} y={y + 3} fill="#4b6058" fontSize="8" fontFamily="DM Mono">
                  {p.toFixed(ticker.decimals || 2)}
                </text>
              </g>
            );
          })}

          {/* Bollinger Bands Shaded Cloud & Lines */}
          {activeIndicators.bb && (
            <g>
              <path
                d={bb.upper
                  .map((val, i) => {
                    if (val === null) return "";
                    const x = padding.left + i * candleSlotWidth + candleSlotWidth / 2;
                    const y = padding.top + ((maxPrice - val) / priceRange) * (mainChartHeight - padding.top - padding.bottom);
                    return `${i === 19 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  })
                  .filter(Boolean)
                  .join(" ")}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <path
                d={bb.lower
                  .map((val, i) => {
                    if (val === null) return "";
                    const x = padding.left + i * candleSlotWidth + candleSlotWidth / 2;
                    const y = padding.top + ((maxPrice - val) / priceRange) * (mainChartHeight - padding.top - padding.bottom);
                    return `${i === 19 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  })
                  .filter(Boolean)
                  .join(" ")}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
            </g>
          )}

          {/* Mountain Area Chart Fill */}
          {chartType === "AREA" && (
            <path
              d={`M ${padding.left} ${mainChartHeight - padding.bottom} ` +
                displayCandles
                  .map((c, i) => {
                    const x = padding.left + i * candleSlotWidth + candleSlotWidth / 2;
                    const y = padding.top + ((maxPrice - c.close) / priceRange) * (mainChartHeight - padding.top - padding.bottom);
                    return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
                  })
                  .join(" ") +
                ` L ${padding.left + (displayCandles.length - 1) * candleSlotWidth + candleSlotWidth / 2} ${mainChartHeight - padding.bottom} Z`}
              fill="rgba(0, 217, 255, 0.12)"
              stroke="#00d9ff"
              strokeWidth="1.5"
            />
          )}

          {/* Full-Width Volume Profile Bars at Bottom */}
          {displayCandles.map((c, i) => {
            const x = padding.left + i * candleSlotWidth + candleSlotWidth / 2;
            const isUp = c.close >= c.open;
            const volHeight = Math.min(28, (c.volume / maxVolume) * 28);
            const y = mainChartHeight - padding.bottom - volHeight;
            return (
              <rect
                key={`vol-${i}`}
                x={x - candleBodyWidth * 0.45}
                y={y}
                width={Math.max(1.5, candleBodyWidth * 0.9)}
                height={volHeight}
                fill={isUp ? "#00cc33" : "#ff3333"}
                opacity="0.22"
              />
            );
          })}

          {/* Candlesticks (Candle & Heikin Modes) */}
          {chartType !== "AREA" &&
            displayCandles.map((c, i) => {
              const x = padding.left + i * candleSlotWidth + candleSlotWidth / 2;
              const openY = padding.top + ((maxPrice - c.open) / priceRange) * (mainChartHeight - padding.top - padding.bottom);
              const closeY = padding.top + ((maxPrice - c.close) / priceRange) * (mainChartHeight - padding.top - padding.bottom);
              const highY = padding.top + ((maxPrice - c.high) / priceRange) * (mainChartHeight - padding.top - padding.bottom);
              const lowY = padding.top + ((maxPrice - c.low) / priceRange) * (mainChartHeight - padding.top - padding.bottom);

              const isUp = c.close >= c.open;
              const color = isUp ? "#00cc33" : "#ff3333";
              const bodyY = Math.min(openY, closeY);
              const bodyHeight = Math.max(Math.abs(closeY - openY), 1.5);

              return (
                <g key={`candle-${i}`}>
                  {/* Upper & Lower Wicks */}
                  <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1" />
                  {/* Real Body */}
                  <rect
                    x={x - candleBodyWidth / 2}
                    y={bodyY}
                    width={candleBodyWidth}
                    height={bodyHeight}
                    fill={color}
                    stroke={color}
                    strokeWidth="0.5"
                  />
                </g>
              );
            })}

          {/* EMA 9 Fast Signal Line */}
          {activeIndicators.ema9 && (
            <path
              d={ema9
                .map((val, i) => {
                  if (val === null) return "";
                  const x = padding.left + i * candleSlotWidth + candleSlotWidth / 2;
                  const y = padding.top + ((maxPrice - val) / priceRange) * (mainChartHeight - padding.top - padding.bottom);
                  return `${i === 8 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                })
                .filter(Boolean)
                .join(" ")}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
          )}

          {/* EMA 21 Trend Line */}
          {activeIndicators.ema21 && (
            <path
              d={ema21
                .map((val, i) => {
                  if (val === null) return "";
                  const x = padding.left + i * candleSlotWidth + candleSlotWidth / 2;
                  const y = padding.top + ((maxPrice - val) / priceRange) * (mainChartHeight - padding.top - padding.bottom);
                  return `${i === 20 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                })
                .filter(Boolean)
                .join(" ")}
              fill="none"
              stroke="#fb923c"
              strokeWidth="1.5"
            />
          )}

          {/* Zerodha-Style Live Price (LTP) Dashed Line & Glowing Tag */}
          <line
            x1={padding.left}
            y1={currentLtpY}
            x2={chartWidth - padding.right}
            y2={currentLtpY}
            stroke={isPos ? "#00cc33" : "#ff3333"}
            strokeDasharray="3 3"
            strokeWidth="1"
            opacity="0.85"
          />
          <g transform={`translate(${chartWidth - padding.right + 2}, ${currentLtpY - 7})`}>
            <rect width="52" height="14" rx="2" fill={isPos ? "#00cc33" : "#ff3333"} />
            <text x="26" y="10" fill="#000" fontSize="8" fontWeight="bold" fontFamily="DM Mono" textAnchor="middle">
              {currentLTP.toFixed(ticker.decimals || 2)}
            </text>
          </g>

          {/* Interactive Mouse Crosshairs (TradingView / Zerodha Kit) */}
          {mousePos && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={mousePos.x}
                y1={padding.top}
                x2={mousePos.x}
                y2={mainChartHeight + subPanelHeight}
                stroke="#64dcb1"
                strokeDasharray="2 2"
                strokeWidth="0.8"
                opacity="0.7"
              />
              {/* Horizontal Crosshair Line */}
              {mousePos.y <= mainChartHeight && (
                <>
                  <line
                    x1={padding.left}
                    y1={mousePos.y}
                    x2={chartWidth - padding.right}
                    y2={mousePos.y}
                    stroke="#64dcb1"
                    strokeDasharray="2 2"
                    strokeWidth="0.8"
                    opacity="0.7"
                  />
                  {/* Y-Axis Hover Price Pill */}
                  <g transform={`translate(${chartWidth - padding.right + 2}, ${mousePos.y - 7})`}>
                    <rect width="52" height="14" rx="2" fill="#1b382d" stroke="#64dcb1" strokeWidth="0.5" />
                    <text x="26" y="10" fill="#f0fdf4" fontSize="8" fontFamily="DM Mono" textAnchor="middle">
                      {hoveredPrice ? hoveredPrice.toFixed(ticker.decimals || 2) : ""}
                    </text>
                  </g>
                </>
              )}
            </g>
          )}

          {/* RSI 14 Sub-Panel Oscillator */}
          {activeIndicators.rsi && (
            <g transform={`translate(0, ${mainChartHeight})`}>
              <line x1={padding.left} y1="0" x2={chartWidth - padding.right} y2="0" stroke="#1c2d25" />
              {/* 70 Overbought Threshold */}
              <line x1={padding.left} y1="12" x2={chartWidth - padding.right} y2="12" stroke="#ff3333" strokeDasharray="2 2" strokeWidth="0.7" opacity="0.6" />
              <text x={chartWidth - padding.right + 6} y="15" fill="#ff5b6e" fontSize="7" fontFamily="DM Mono">70</text>
              {/* 30 Oversold Threshold */}
              <line x1={padding.left} y1="36" x2={chartWidth - padding.right} y2="36" stroke="#00cc33" strokeDasharray="2 2" strokeWidth="0.7" opacity="0.6" />
              <text x={chartWidth - padding.right + 6} y="39" fill="#64dcb1" fontSize="7" fontFamily="DM Mono">30</text>

              {/* RSI Spline */}
              <path
                d={rsi
                  .map((val, i) => {
                    const x = padding.left + i * candleSlotWidth + candleSlotWidth / 2;
                    const y = 48 - (val / 100) * 48;
                    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#c084fc"
                strokeWidth="1.2"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
