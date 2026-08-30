import React, { useState } from "react";
import RealTimeCandleChart from "./RealTimeCandleChart.jsx";
import OrderTicket from "./OrderTicket.jsx";
import PortfolioBlotter, { INITIAL_PORTFOLIO_POSITIONS } from "./PortfolioBlotter.jsx";
import FxCarryAnalytics from "./FxCarryAnalytics.jsx";
import RiskVaRPanel from "./RiskVaRPanel.jsx";
import LiveNewsFeed from "./LiveNewsFeed.jsx";
import InstitutionalEntityBrowser from "./InstitutionalEntityBrowser.jsx";
import LeftPanel from "./LeftPanel/LeftPanel.jsx";
import RightPanel from "./RightPanel/RightPanel.jsx";
import "../../src/styles/terminal-layout.css";

export default function TerminalWorkspace({ onSelectSymbol, onFilterEntity, externalSymbol, focusedDossier }) {
  const [deskLayout, setDeskLayout] = useState("trading"); // "trading" | "risk" | "news" | "graph"
  const [selectedSymbol, setSelectedSymbol] = useState(externalSymbol || "EUR/USD");
  const [positions, setPositions] = useState(INITIAL_PORTFOLIO_POSITIONS);
  const [accountBalance, setAccountBalance] = useState(1000000);

  // Sync external symbol if changed via Super Search
  React.useEffect(() => {
    if (externalSymbol && externalSymbol !== selectedSymbol) {
      setSelectedSymbol(externalSymbol);
    }
  }, [externalSymbol]);

  const handleExecuteOrder = (order) => {
    const newPosition = {
      id: order.id,
      symbol: order.symbol,
      side: order.side,
      entryPrice: order.executionPrice,
      units: order.units,
      notional: order.notional,
      margin: order.margin,
      leverage: order.leverage,
      carryRateAnnual: order.symbol.includes("USD") ? 2.5 : 0.8,
      holdingDays: 1,
      feePaid: 15,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC",
    };

    setPositions((prev) => [newPosition, ...prev]);
  };

  const handleClosePosition = (positionId) => {
    setPositions((prev) => prev.filter((p) => p.id !== positionId));
  };

  return (
    <section className="terminal-workspace-container">
      {/* Workspace Sub-Toolbar */}
      <div className="terminal-sub-toolbar">
        <div className="desk-preset-tabs">
          <button
            className={`desk-tab-btn ${deskLayout === "trading" ? "active" : ""}`}
            onClick={() => setDeskLayout("trading")}
          >
            ⚡ FX & MACRO TRADING DESK
          </button>
          <button
            className={`desk-tab-btn ${deskLayout === "risk" ? "active" : ""}`}
            onClick={() => setDeskLayout("risk")}
          >
            🛡 RISK & VaR ANALYTICS
          </button>
          <button
            className={`desk-tab-btn ${deskLayout === "news" ? "active" : ""}`}
            onClick={() => setDeskLayout("news")}
          >
            📰 LIVE NEWS & EVENT STREAM
          </button>
          <button
            className={`desk-tab-btn ${deskLayout === "graph" ? "active" : ""}`}
            onClick={() => setDeskLayout("graph")}
          >
            🌐 INSTITUTIONAL GRAPH (274 NODES)
          </button>
        </div>

        <div className="workspace-status-strip">
          <span>ACTIVE DESK: <b>{deskLayout.toUpperCase()}</b></span>
          <span>FEED: <b style={{ color: "#64dcb1" }}>CONNECTED (280ms)</b></span>
        </div>
      </div>

      {/* DESK 1: FX & MACRO TRADING DESK */}
      {deskLayout === "trading" && (
        <div className="terminal-content" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {/* Left Watchlist Panel */}
          <LeftPanel
            selectedTicker={{ symbol: selectedSymbol }}
            onSelectTicker={(t) => {
              setSelectedSymbol(t.symbol);
              if (onSelectSymbol) onSelectSymbol(t.symbol);
            }}
          />

          {/* Center Chart + Blotter Panel */}
          <div className="center-panel">
            <div className="chart-container">
              <RealTimeCandleChart symbol={selectedSymbol} />
            </div>
            <PortfolioBlotter
              positions={positions}
              onClosePosition={handleClosePosition}
              accountBalance={accountBalance}
            />
          </div>

          {/* Right Risk & Execution Panel */}
          <RightPanel
            selectedTicker={{
              symbol: selectedSymbol,
              last: selectedSymbol.includes("USD") && !selectedSymbol.includes("/") ? 580.25 : 1.0874,
              pctChange: 0.35,
              high: selectedSymbol.includes("USD") && !selectedSymbol.includes("/") ? 582.00 : 1.0892,
              low: selectedSymbol.includes("USD") && !selectedSymbol.includes("/") ? 578.00 : 1.0838,
              decimals: selectedSymbol.includes("JPY") || !selectedSymbol.includes("/") ? 2 : 4,
            }}
            onExecuteOrder={handleExecuteOrder}
          />
        </div>
      )}

      {/* DESK 2: RISK & VaR ANALYTICS */}
      {deskLayout === "risk" && (
        <div className="risk-desk-grid">
          <div className="risk-top-row">
            <div className="pane-risk">
              <RiskVaRPanel positions={positions} />
            </div>
            <div className="pane-carry">
              <FxCarryAnalytics
                onSelectPair={(pair) => {
                  setSelectedSymbol(pair);
                  setDeskLayout("trading");
                }}
              />
            </div>
          </div>
          <div className="risk-bottom-row">
            <PortfolioBlotter
              positions={positions}
              onClosePosition={handleClosePosition}
              accountBalance={accountBalance}
            />
          </div>
        </div>
      )}

      {/* DESK 3: LIVE NEWS & EVENT STREAM */}
      {deskLayout === "news" && (
        <div className="news-desk-grid">
          <div className="pane-news-full">
            <LiveNewsFeed onFilterEntity={onFilterEntity} />
          </div>
        </div>
      )}

      {/* DESK 4: INSTITUTIONAL GRAPH & MASTER TABLE */}
      {deskLayout === "graph" && (
        <div style={{ padding: "0", height: "calc(100vh - 180px)", minHeight: "650px" }}>
          <InstitutionalEntityBrowser
            onSelectEntity={(entity) => {
              if (onFilterEntity) onFilterEntity(entity.name);
            }}
          />
        </div>
      )}
    </section>
  );
}
