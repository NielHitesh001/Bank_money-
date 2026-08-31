import React, { useEffect, useState, useMemo } from "react";

export const EquityCurve = ({ equity = [] }) => {
  const [pathD, setPathD] = useState("");
  const [benchPathD, setBenchPathD] = useState("");
  const SVG_WIDTH = 600;
  const SVG_HEIGHT = 160;
  const PADDING_X = 55;
  const PADDING_Y = 20;

  // Normalize equity whether it is an array of numbers or array of objects { equity, benchmark }
  const normalizedSeries = useMemo(() => {
    const rawList = Array.isArray(equity) ? equity : (equity?.equityCurve || equity?.equity_curve || []);
    if (!rawList || rawList.length === 0) return [];

    return rawList.map((item) => {
      if (typeof item === "number") {
        return { eq: item, bench: null };
      }
      if (typeof item === "object" && item !== null) {
        return {
          eq: Number(item.equity ?? item.eq ?? item.close ?? 0),
          bench: item.benchmark !== undefined && item.benchmark !== null ? Number(item.benchmark) : null,
        };
      }
      return { eq: Number(item) || 0, bench: null };
    });
  }, [equity]);

  const { minVal, maxVal, range } = useMemo(() => {
    if (normalizedSeries.length === 0) return { minVal: 100000, maxVal: 100000, range: 1 };
    let min = Infinity;
    let max = -Infinity;
    normalizedSeries.forEach((pt) => {
      if (pt.eq < min) min = pt.eq;
      if (pt.eq > max) max = pt.eq;
      if (pt.bench !== null) {
        if (pt.bench < min) min = pt.bench;
        if (pt.bench > max) max = pt.bench;
      }
    });
    if (!isFinite(min) || !isFinite(max) || min === max) {
      const fallback = normalizedSeries[0]?.eq || 100000;
      return { minVal: fallback * 0.95, maxVal: fallback * 1.05, range: fallback * 0.10 || 1 };
    }
    return { minVal: min, maxVal: max, range: max - min };
  }, [normalizedSeries]);

  useEffect(() => {
    if (normalizedSeries.length < 2) {
      setPathD("");
      setBenchPathD("");
      return;
    }

    const plotW = SVG_WIDTH - 2 * PADDING_X;
    const plotH = SVG_HEIGHT - 2 * PADDING_Y;

    // Generate strategy equity path
    const points = normalizedSeries.map((pt, i) => {
      const x = PADDING_X + (i / (normalizedSeries.length - 1)) * plotW;
      const y = SVG_HEIGHT - PADDING_Y - ((pt.eq - minVal) / range) * plotH;
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
    });

    const dStr = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    setPathD(dStr);

    // Generate benchmark path if available
    const hasBenchmark = normalizedSeries.some((pt) => pt.bench !== null);
    if (hasBenchmark) {
      const benchPoints = normalizedSeries.map((pt, i) => {
        const val = pt.bench !== null ? pt.bench : pt.eq;
        const x = PADDING_X + (i / (normalizedSeries.length - 1)) * plotW;
        const y = SVG_HEIGHT - PADDING_Y - ((val - minVal) / range) * plotH;
        return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
      });
      setBenchPathD(benchPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" "));
    } else {
      setBenchPathD("");
    }
  }, [normalizedSeries, minVal, maxVal, range]);

  if (!equity || normalizedSeries.length === 0) {
    return (
      <div
        style={{
          background: "#040705",
          border: "1px solid #14221b",
          borderRadius: "4px",
          padding: "24px",
          textAlign: "center",
          color: "#6e8a7f",
          fontSize: "11px",
        }}
      >
        ⚡ Run a backtest or select a strategy template to render the live equity curve.
      </div>
    );
  }

  const latestVal = normalizedSeries[normalizedSeries.length - 1]?.eq || minVal;
  const initialVal = normalizedSeries[0]?.eq || minVal;
  const totalReturn = initialVal ? (((latestVal - initialVal) / initialVal) * 100).toFixed(2) : "0.00";
  const isPositive = Number(totalReturn) >= 0;

  return (
    <div
      style={{
        background: "#040705",
        border: "1px solid #14221b",
        borderRadius: "4px",
        padding: "8px 10px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "10px",
          marginBottom: "6px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#8da49c", fontWeight: "bold" }}>
            📈 CUMULATIVE EQUITY CURVE
          </span>
          <span style={{ color: "#52d6aa", fontSize: "9px" }}>
            ● Strategy Line
          </span>
          {benchPathD && (
            <span style={{ color: "#38bdf8", fontSize: "9px" }}>
              --- Buy & Hold Benchmark
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ color: "#8da49c", fontSize: "9.5px" }}>
            Return: <strong style={{ color: isPositive ? "#52d6aa" : "#ff5b6e" }}>{isPositive ? "+" : ""}{totalReturn}%</strong>
          </span>
          <span style={{ color: "#64dcb1", fontSize: "11px", fontWeight: "bold" }}>
            ${latestVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        style={{ width: "100%", height: "130px", display: "block" }}
      >
        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = SVG_HEIGHT - PADDING_Y - pct * (SVG_HEIGHT - 2 * PADDING_Y);
          const labelVal = minVal + pct * range;
          return (
            <g key={`grid-${pct}`}>
              <line
                x1={PADDING_X}
                y1={y}
                x2={SVG_WIDTH - 15}
                y2={y}
                stroke="#162820"
                strokeDasharray="2 3"
                strokeWidth="1"
              />
              <text
                x={PADDING_X - 6}
                y={y + 3}
                textAnchor="end"
                fill="#557065"
                fontSize="8.5"
                fontFamily="monospace"
              >
                ${Math.round(labelVal).toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Vertical Axes */}
        <line
          x1={PADDING_X}
          y1={PADDING_Y}
          x2={PADDING_X}
          y2={SVG_HEIGHT - PADDING_Y}
          stroke="#1f382c"
          strokeWidth="1"
        />
        <line
          x1={PADDING_X}
          y1={SVG_HEIGHT - PADDING_Y}
          x2={SVG_WIDTH - 15}
          y2={SVG_HEIGHT - PADDING_Y}
          stroke="#1f382c"
          strokeWidth="1"
        />

        {/* Benchmark line (dashed cyan) */}
        {benchPathD && (
          <path
            d={benchPathD}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.75"
          />
        )}

        {/* Strategy Equity line (glowing green) */}
        <path
          d={pathD}
          fill="none"
          stroke="#52d6aa"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};

export default EquityCurve;
