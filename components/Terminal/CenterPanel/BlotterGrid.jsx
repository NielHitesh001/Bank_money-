import React from "react";

export default function BlotterGrid({ positions = [], onClosePosition }) {
  const defaultPositions = [
    { id: "POS-001", symbol: "EUR/USD", side: "BUY", units: 100000, entryPrice: 1.0850, currentPrice: 1.0874, notional: 108740, pnl: 240.00, status: "OPEN" },
    { id: "POS-002", symbol: "SPY", side: "BUY", units: 50, entryPrice: 578.20, currentPrice: 580.25, notional: 29012, pnl: 102.50, status: "OPEN" },
    { id: "POS-003", symbol: "AAPL", side: "BUY", units: 100, entryPrice: 226.50, currentPrice: 228.30, notional: 22830, pnl: 180.00, status: "OPEN" },
    { id: "POS-004", symbol: "NVDA", side: "BUY", units: 80, entryPrice: 121.80, currentPrice: 125.40, notional: 10032, pnl: 288.00, status: "OPEN" },
    { id: "POS-005", symbol: "BTC/USD", side: "BUY", units: 1.5, entryPrice: 62400.00, currentPrice: 63845.00, notional: 95767, pnl: 2167.50, status: "OPEN" },
  ];

  const displayPositions = positions && positions.length > 0 ? positions : defaultPositions;
  const totalPnL = displayPositions.reduce((acc, pos) => acc + (pos.pnl || 0), 0);

  return (
    <div className="blotter-section">
      <div className="blotter-header">
        <span>ACTIVE POSITIONS & ORDER BLOTTER ({displayPositions.length})</span>
        <span style={{ color: totalPnL >= 0 ? "#00cc33" : "#ff5b6e" }}>
          TOTAL UNREALIZED P&L: <b>{totalPnL >= 0 ? "+$" : "-$"}{Math.abs(totalPnL).toFixed(2)}</b>
        </span>
      </div>

      <div className="blotter-content">
        <div style={{ display: "grid", gridTemplateColumns: "80px 50px 70px 80px 1fr", gap: "10px", paddingBottom: "4px", borderBottom: "1px solid #222", color: "#666", fontSize: "9px", textTransform: "uppercase" }}>
          <span>Symbol</span>
          <span>Side</span>
          <span>Size</span>
          <span>Entry / Last</span>
          <span>Net PnL & Status</span>
        </div>

        {displayPositions.map((pos) => {
          const isPos = (pos.pnl || 0) >= 0;
          return (
            <div key={pos.id || pos.symbol} className="blotter-row">
              <div className="blotter-row__ticker">{pos.symbol}</div>
              <div className={pos.side === "BUY" ? "blotter-row__buy" : "blotter-row__sell"}>
                {pos.side}
              </div>
              <div>{pos.units || pos.quantity}</div>
              <div>
                {(pos.entryPrice || 0).toFixed(2)} / {(pos.currentPrice || pos.entryPrice || 0).toFixed(2)}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={isPos ? "blotter-row__pnl-positive" : "blotter-row__pnl-negative"}>
                  {isPos ? "+$" : "-$"}{Math.abs(pos.pnl || 0).toFixed(2)}
                </span>
                {onClosePosition && (
                  <button
                    onClick={() => onClosePosition(pos.id)}
                    style={{
                      background: "transparent",
                      border: "0.5px solid #333",
                      color: "#888",
                      fontSize: "9px",
                      padding: "1px 4px",
                      borderRadius: "2px",
                      cursor: "pointer",
                    }}
                  >
                    CLOSE
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
