import React, { useEffect, useState } from "react";
import TerminalHeader from "./TerminalHeader.jsx";
import SuperSearchBar from "./SuperSearchBar.jsx";
import LeftPanel from "./LeftPanel/LeftPanel.jsx";
import CenterPanel from "./CenterPanel/CenterPanel.jsx";
import RightPanel from "./RightPanel/RightPanel.jsx";
import "../../src/styles/terminal-layout.css";

export default function TerminalLayout({ onSelectEntity, onFilterEntity }) {
  const [selectedTicker, setSelectedTicker] = useState({
    symbol: "EUR/USD",
    name: "Euro / US Dollar",
    last: 1.0874,
    pctChange: 0.26,
    high: 1.0892,
    low: 1.0838,
    decimals: 4,
    assetClass: "FX",
  });

  const [positions, setPositions] = useState([
    { id: "POS-001", symbol: "EUR/USD", side: "BUY", units: 100000, entryPrice: 1.0850, currentPrice: 1.0874, notional: 108740, pnl: 240.00, status: "OPEN" },
    { id: "POS-002", symbol: "SPY", side: "BUY", units: 50, entryPrice: 578.20, currentPrice: 580.25, notional: 29012, pnl: 102.50, status: "OPEN" },
    { id: "POS-003", symbol: "AAPL", side: "BUY", units: 100, entryPrice: 226.50, currentPrice: 228.30, notional: 22830, pnl: 180.00, status: "OPEN" },
  ]);

  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1440,
    height: typeof window !== "undefined" ? window.innerHeight : 900,
  });

  // Track viewport changes
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Enforce zero page scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleExecuteOrder = (order) => {
    const newPos = {
      id: order.id || `POS-${Date.now().toString().slice(-4)}`,
      symbol: order.symbol,
      side: order.side,
      units: order.units,
      entryPrice: order.executionPrice,
      currentPrice: order.executionPrice,
      notional: order.notional,
      pnl: 0,
      status: "OPEN",
    };
    setPositions((prev) => [newPos, ...prev]);
  };

  const handleClosePosition = (posId) => {
    setPositions((prev) => prev.filter((p) => p.id !== posId));
  };

  const isDesktop = viewportSize.width >= 1366;
  const isTablet = viewportSize.width >= 768 && viewportSize.width < 1366;
  const isMobile = viewportSize.width < 768;

  return (
    <div className="terminal-container">
      {/* 1. Fixed Header (44px) */}
      <TerminalHeader />

      {/* 2. Fixed Super Search Bar (48px) */}
      <div className="super-search-bar">
        <SuperSearchBar
          onSelectSymbol={(sym) => {
            setSelectedTicker((prev) => ({
              ...prev,
              symbol: sym,
              last: sym.includes("USD") && !sym.includes("/") ? 580.25 : 1.0874,
              decimals: sym.includes("JPY") || !sym.includes("/") ? 2 : 4,
            }));
          }}
          onSelectEntity={(dossier) => {
            if (dossier.market) {
              setSelectedTicker({
                symbol: dossier.symbol,
                name: dossier.entity?.name || dossier.symbol,
                last: dossier.market.price,
                pctChange: dossier.market.changePct,
                high: dossier.market.high,
                low: dossier.market.low,
                decimals: dossier.symbol.includes("JPY") || !dossier.symbol.includes("/") ? 2 : 4,
                assetClass: dossier.entity?.category || "Equities",
              });
            }
            if (onSelectEntity) onSelectEntity(dossier);
          }}
        />
      </div>

      {/* 3. Main Bloomberg Content Grid */}
      <div className="terminal-content">
        {/* Left Watchlist Panel (Desktop only) */}
        {isDesktop && (
          <LeftPanel
            selectedTicker={selectedTicker}
            onSelectTicker={(t) => setSelectedTicker(t)}
          />
        )}

        {/* Center Panel (Chart 290px + BlotterGrid remaining) */}
        <CenterPanel
          selectedTicker={selectedTicker}
          positions={positions}
          onClosePosition={handleClosePosition}
        />

        {/* Right Risk & Execution Panel (Desktop & Tablet landscape) */}
        {(isDesktop || isTablet) && (
          <RightPanel
            selectedTicker={selectedTicker}
            onExecuteOrder={handleExecuteOrder}
          />
        )}
      </div>
    </div>
  );
}
