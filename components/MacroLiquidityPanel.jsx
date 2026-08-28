import React, { useEffect, useMemo, useState } from "react";
import { fetchMacroLiquidity, MACRO_SERIES_CONFIG } from "../src/services/macroLiquidityService";
import CorporateTreasuryIntelligence from "./CorporateTreasuryIntelligence";
import GlobalPieCharts from "./GlobalPieCharts";

export default function MacroLiquidityPanel() {
  const [data, setData] = useState(null);
  const [selectedKey, setSelectedKey] = useState("m2");
  const [hoverIndex, setHoverIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchMacroLiquidity()
      .then((res) => {
        if (active) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const activeConfig = useMemo(() => {
    return MACRO_SERIES_CONFIG.find((s) => s.key === selectedKey) || MACRO_SERIES_CONFIG[0];
  }, [selectedKey]);

  const seriesData = useMemo(() => {
    if (!data?.series?.[selectedKey]) return [];
    return data.series[selectedKey];
  }, [data, selectedKey]);

  const stats = useMemo(() => {
    if (!seriesData.length) return { current: 0, change: 0, min: 0, max: 0, pct: 0 };
    const values = seriesData.map((d) => d.value);
    const current = values[values.length - 1];
    const initial = values[0];
    const change = +(current - initial).toFixed(2);
    const pct = initial !== 0 ? +((change / initial) * 100).toFixed(2) : 0;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { current, change, min, max, pct, latestDate: seriesData[seriesData.length - 1].date };
  }, [seriesData]);

  // Chart SVG coordinate generation
  const chartCoordinates = useMemo(() => {
    if (seriesData.length < 2) return { path: "", area: "", points: [] };
    const width = 560;
    const height = 170;
    const padding = 18;
    const values = seriesData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = seriesData.map((item, index) => {
      const x = padding + (index / (seriesData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((item.value - min) / range) * (height - 2 * padding);
      return { x, y, value: item.value, date: item.date };
    });

    const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const area = `${path} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;

    return { path, area, points, width, height };
  }, [seriesData]);

  const hoveredPoint = hoverIndex !== null && chartCoordinates.points[hoverIndex] ? chartCoordinates.points[hoverIndex] : null;

  return (
    <section className="dashboard-panel macro-split-dashboard">
      {/* Top Header */}
      <div className="panel-heading">
        <div className="macro-head-left">
          <span className="eyebrow">MACRO LIQUIDITY, CORPORATE CASH RESERVES & GLOBAL SHARE</span>
          <h2>Global Liquidity & Corporate Treasury Monitor</h2>
        </div>
        <div className="macro-head-right">
          <span className={`data-badge ${data?.source === "live" ? "live" : "cached"}`}>
            {data?.source === "live" ? "● FRED / WB LIVE" : "◐ FRED SEED DATA"}
          </span>
        </div>
      </div>

      {/* Main Split Screen Container */}
      <div className="macro-split-grid">
        {/* LEFT COLUMN: FRED Monetary Series & Sovereign GDP */}
        <div className="macro-left-col">
          {/* Series Tabs */}
          <div className="macro-series-tabs">
            {MACRO_SERIES_CONFIG.map((cfg) => (
              <button
                key={cfg.key}
                onClick={() => setSelectedKey(cfg.key)}
                className={`series-tab ${selectedKey === cfg.key ? "active" : ""}`}
                title={cfg.description}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Metric KPIs */}
          <div className="macro-metrics-strip">
            <div className="metric-box main">
              <span className="label">{activeConfig.label}</span>
              <div className="value-row">
                <strong>{stats.current} <small>{activeConfig.unit}</small></strong>
                <span className={`delta ${stats.change >= 0 ? "positive" : "negative"}`}>
                  {stats.change >= 0 ? "+" : ""}{stats.change} ({stats.pct}%)
                </span>
              </div>
              <small className="muted">As of {stats.latestDate || "—"}</small>
            </div>

            <div className="metric-box">
              <span className="label">24M Low</span>
              <strong>{stats.min} {activeConfig.unit}</strong>
            </div>

            <div className="metric-box">
              <span className="label">24M High</span>
              <strong>{stats.max} {activeConfig.unit}</strong>
            </div>

            <div className="metric-box">
              <span className="label">Description</span>
              <p className="desc-text">{activeConfig.description}</p>
            </div>
          </div>

          {/* Line & Area Chart */}
          <div className="chart-container">
            <svg
              viewBox={`0 0 ${chartCoordinates.width || 560} ${chartCoordinates.height || 170}`}
              preserveAspectRatio="none"
              className="macro-svg-chart"
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="macroAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="18" y1="25" x2="542" y2="25" stroke="#1d2e29" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="18" y1="85" x2="542" y2="85" stroke="#1d2e29" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="18" y1="145" x2="542" y2="145" stroke="#1d2e29" strokeDasharray="3 3" strokeWidth="1" />

              {chartCoordinates.area && <path d={chartCoordinates.area} fill="url(#macroAreaGrad)" />}
              {chartCoordinates.path && <path d={chartCoordinates.path} fill="none" stroke="#38bdf8" strokeWidth="2.5" />}

              {chartCoordinates.points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoverIndex === i ? 5 : 2.5}
                    fill={hoverIndex === i ? "#64dcb1" : "#38bdf8"}
                    stroke="#0a0f0d"
                    strokeWidth="1.5"
                  />
                  <rect
                    x={p.x - 12}
                    y={0}
                    width={24}
                    height={chartCoordinates.height}
                    fill="transparent"
                    onMouseEnter={() => setHoverIndex(i)}
                    style={{ cursor: "crosshair" }}
                  />
                </g>
              ))}

              {hoveredPoint && (
                <line
                  x1={hoveredPoint.x}
                  y1="10"
                  x2={hoveredPoint.x}
                  y2="160"
                  stroke="#64dcb1"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
              )}
            </svg>

            {hoveredPoint && (
              <div
                className="chart-tooltip"
                style={{
                  left: `${(hoveredPoint.x / (chartCoordinates.width || 560)) * 100}%`,
                  top: `${hoveredPoint.y - 28}px`,
                }}
              >
                <b>{hoveredPoint.value} {activeConfig.unit}</b>
                <time>{hoveredPoint.date}</time>
              </div>
            )}
          </div>

          {/* Sovereign GDP Bars */}
          <div className="gdp-distribution-section">
            <div className="section-title">
              <span>WORLD BANK · TOP SOVEREIGN GDP</span>
              <small>Nominal GDP ($ Trillion USD) & Global Share</small>
            </div>
            <div className="gdp-bars">
              {(data?.gdp || []).map((item) => (
                <div key={item.country} className="gdp-bar-row">
                  <span className="country-code">{item.country}</span>
                  <span className="country-name">{item.name}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(item.gdp / 30) * 100}%` }} />
                  </div>
                  <strong className="gdp-val">${item.gdp}T</strong>
                  <small className="gdp-share">{item.share}%</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Corporate Cash Reserves & Global Allocation Pie Charts */}
        <div className="macro-right-col">
          {/* Top Half: Corporate Treasury Intelligence (Search & Cash Reserves) */}
          <CorporateTreasuryIntelligence />

          {/* Bottom Half: Global Reserves & Payment Rails Pie Charts */}
          <GlobalPieCharts />
        </div>
      </div>
    </section>
  );
}
