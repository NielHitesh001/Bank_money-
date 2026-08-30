import React, { useState } from "react";
import OrderTicket from "../OrderTicket.jsx";

export default function RightPanel({ selectedTicker, onExecuteOrder }) {
  const [activeTab, setActiveTab] = useState("risk"); // "risk" | "order"
  const t = selectedTicker || { symbol: "EUR/USD", last: 1.0874, pctChange: 0.26, high: 1.0892, low: 1.0838, volume: 48200000 };
  const isPos = (t.pctChange || 0) >= 0;

  return (
    <aside className="right-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="right-panel__title">
          {t.symbol} {activeTab === "risk" ? "RISK & METRICS" : "EXECUTION"}
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          <button
            onClick={() => setActiveTab("risk")}
            style={{
              background: activeTab === "risk" ? "#00d9ff" : "#141414",
              color: activeTab === "risk" ? "#000" : "#888",
              border: "0.5px solid #222",
              fontSize: "9px",
              padding: "2px 6px",
              borderRadius: "2px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            RISK
          </button>
          <button
            onClick={() => setActiveTab("order")}
            style={{
              background: activeTab === "order" ? "#00d9ff" : "#141414",
              color: activeTab === "order" ? "#000" : "#888",
              border: "0.5px solid #222",
              fontSize: "9px",
              padding: "2px 6px",
              borderRadius: "2px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            TRADE
          </button>
        </div>
      </div>

      {activeTab === "risk" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Price Card */}
          <div className="right-panel__stat-card">
            <div className="right-panel__stat-label">Last Market Price</div>
            <div className="right-panel__stat-value">${(t.last || t.price || 0).toFixed(t.decimals || 2)}</div>
            <div className={`right-panel__stat-change ${isPos ? "" : "negative"}`}>
              {isPos ? "+" : ""}{(t.pctChange || 0).toFixed(2)}% Daily Delta
            </div>
          </div>

          {/* 24h High / Low */}
          <div className="right-panel__stat-card">
            <div className="right-panel__stat-label">24H RANGE & SPREAD</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#ddd", marginTop: "4px", fontFamily: "DM Mono" }}>
              <span>HIGH: <b style={{ color: "#00cc33" }}>${(t.high || t.last * 1.01).toFixed(t.decimals || 2)}</b></span>
              <span>LOW: <b style={{ color: "#ff5b6e" }}>${(t.low || t.last * 0.99).toFixed(t.decimals || 2)}</b></span>
            </div>
          </div>

          {/* Value at Risk (VaR) */}
          <div className="right-panel__stat-card">
            <div className="right-panel__stat-label">PARAMETRIC VALUE AT RISK</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "11px", fontFamily: "DM Mono" }}>
              <div>
                <div style={{ color: "#666", fontSize: "9px" }}>95% VaR (1-Day)</div>
                <div style={{ color: "#ffaa00", fontWeight: "bold" }}>$1,250.00</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#666", fontSize: "9px" }}>99% VaR (1-Day)</div>
                <div style={{ color: "#ff5b6e", fontWeight: "bold" }}>$2,450.00</div>
              </div>
            </div>
          </div>

          {/* Quantitative Greeks */}
          <div className="right-panel__stat-card">
            <div className="right-panel__stat-label">SENSITIVITY DERIVATIVES</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "4px", fontSize: "10px", fontFamily: "DM Mono", color: "#aaa" }}>
              <div>Δ Delta: <b style={{ color: "#e0e0e0" }}>0.62</b></div>
              <div>Γ Gamma: <b style={{ color: "#e0e0e0" }}>0.04</b></div>
              <div>Θ Theta: <b style={{ color: "#ff5b6e" }}>-12.4</b></div>
              <div>ν Vega: <b style={{ color: "#00d9ff" }}>0.18</b></div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ height: "100%", overflowY: "auto" }}>
          <OrderTicket onExecuteOrder={onExecuteOrder} accountBalance={1000000} />
        </div>
      )}
    </aside>
  );
}
