import React, { useEffect, useMemo, useState } from "react";
import { wsMarketManager } from "../../src/services/wsManager.js";
import { attributeTradePnL } from "../../src/analytics/pnlAttribution.js";

export const INITIAL_PORTFOLIO_POSITIONS = [
  {
    id: "POS-001",
    symbol: "EUR/USD",
    side: "BUY",
    entryPrice: 1.0845,
    units: 200000,
    notional: 216900,
    margin: 43380,
    leverage: 5,
    carryRateAnnual: 1.5,
    holdingDays: 3,
    feePaid: 25,
    timestamp: "2026-08-26 14:20 UTC",
  },
  {
    id: "POS-002",
    symbol: "USD/JPY",
    side: "SELL",
    entryPrice: 146.10,
    units: 1500,
    notional: 219150,
    margin: 21915,
    leverage: 10,
    carryRateAnnual: 4.8,
    holdingDays: 5,
    feePaid: 35,
    timestamp: "2026-08-24 09:15 UTC",
  },
  {
    id: "POS-003",
    symbol: "XAU/USD",
    side: "BUY",
    entryPrice: 2498.00,
    units: 100,
    notional: 249800,
    margin: 49960,
    leverage: 5,
    carryRateAnnual: -0.5,
    holdingDays: 2,
    feePaid: 45,
    timestamp: "2026-08-27 11:30 UTC",
  },
];

export default function PortfolioBlotter({
  positions = INITIAL_PORTFOLIO_POSITIONS,
  onClosePosition,
  accountBalance = 1000000,
}) {
  const [livePrices, setLivePrices] = useState(() => {
    const map = {};
    wsMarketManager.getAllTickers().forEach((t) => {
      map[t.symbol] = t.last;
    });
    return map;
  });

  useEffect(() => {
    const unsubscribe = wsMarketManager.subscribe((tick) => {
      setLivePrices((prev) => ({
        ...prev,
        [tick.symbol]: tick.last,
      }));
    });
    return () => unsubscribe();
  }, []);

  const analyzedPositions = useMemo(() => {
    return positions.map((pos) => {
      const currentPrice = livePrices[pos.symbol] || pos.entryPrice;
      const attribution = attributeTradePnL(pos, currentPrice);
      return {
        ...pos,
        ...attribution,
      };
    });
  }, [positions, livePrices]);

  const summary = useMemo(() => {
    const totalNotional = analyzedPositions.reduce((acc, p) => acc + p.notional, 0);
    const totalMargin = analyzedPositions.reduce((acc, p) => acc + (p.margin || 0), 0);
    const totalSpotPnL = analyzedPositions.reduce((acc, p) => acc + p.spotPnL, 0);
    const totalCarryPnL = analyzedPositions.reduce((acc, p) => acc + p.carryPnL, 0);
    const totalNetPnL = analyzedPositions.reduce((acc, p) => acc + p.netPnL, 0);
    const totalEquity = accountBalance + totalNetPnL;
    const marginUtilization = totalEquity > 0 ? ((totalMargin / totalEquity) * 100).toFixed(1) : "0";

    return {
      totalNotional,
      totalMargin,
      totalSpotPnL,
      totalCarryPnL,
      totalNetPnL,
      totalEquity,
      marginUtilization,
      freeMargin: totalEquity - totalMargin,
    };
  }, [analyzedPositions, accountBalance]);

  const exportTrades = (format) => {
    if (format === "json") {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analyzedPositions, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `trading-journal-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = ["Position ID", "Symbol", "Side", "Units", "Entry Price", "Mark Price", "Spot PnL", "Carry PnL", "Net PnL", "Return on Margin %"];
      const rows = analyzedPositions.map((p) => [
        p.id,
        p.symbol,
        p.side,
        p.units,
        p.entryPrice,
        p.currentPrice,
        p.spotPnL,
        p.carryPnL,
        p.netPnL,
        p.returnOnMarginPct,
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `trading-journal-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <div className="terminal-blotter-panel">
      {/* Portfolio Account Bar */}
      <div className="blotter-account-summary">
        <div className="account-metric-box main">
          <span>NET PORTFOLIO EQUITY</span>
          <strong>${summary.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>

        <div className="account-metric-box">
          <span>TOTAL UNREALIZED PNL</span>
          <strong className={summary.totalNetPnL >= 0 ? "pnl-pos" : "pnl-neg"}>
            {summary.totalNetPnL >= 0 ? "+$" : "-$"}{Math.abs(summary.totalNetPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong>
        </div>

        <div className="account-metric-box">
          <span>ACCRUED CARRY</span>
          <strong style={{ color: "#64dcb1" }}>+${summary.totalCarryPnL.toFixed(2)}</strong>
        </div>

        <div className="account-metric-box">
          <span>MARGIN UTILIZATION</span>
          <strong>{summary.marginUtilization}%</strong>
        </div>

        <div className="account-metric-box">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>FREE MARGIN</span>
            <div className="journal-export-btns" style={{ display: "flex", gap: "3px" }}>
              <button onClick={() => exportTrades("json")} className="blotter-export-btn" title="Export Journal as JSON">JSON</button>
              <button onClick={() => exportTrades("csv")} className="blotter-export-btn" title="Export Journal as CSV">CSV</button>
            </div>
          </div>
          <strong>${summary.freeMargin.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
        </div>
      </div>

      {/* Positions Table */}
      <div className="blotter-table-wrap">
        <table className="bloomberg-table blotter-grid">
          <thead>
            <tr>
              <th>POSITION ID</th>
              <th>SYMBOL</th>
              <th>SIDE</th>
              <th>UNITS</th>
              <th>ENTRY PRICE</th>
              <th>MARK PRICE</th>
              <th>SPOT P&L ($)</th>
              <th>CARRY ($)</th>
              <th>NET P&L (USD)</th>
              <th>RETURN ON MARGIN</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {analyzedPositions.map((pos) => {
              const isPos = pos.netPnL >= 0;
              return (
                <tr key={pos.id} className="blotter-row">
                  <td className="tx-id-cell">{pos.id}</td>
                  <td>
                    <strong style={{ color: "#38bdf8" }}>{pos.symbol}</strong>
                  </td>
                  <td>
                    <span className={`side-badge ${pos.side.toLowerCase()}`}>
                      {pos.side} {pos.leverage}x
                    </span>
                  </td>
                  <td>{pos.units.toLocaleString()}</td>
                  <td className="timestamp-cell">{pos.entryPrice}</td>
                  <td style={{ color: "#f0fdf4", fontWeight: "600" }}>{pos.currentPrice}</td>
                  <td className={pos.spotPnL >= 0 ? "pnl-pos" : "pnl-neg"}>
                    {pos.spotPnL >= 0 ? "+$" : "-$"}{Math.abs(pos.spotPnL).toFixed(2)}
                  </td>
                  <td style={{ color: "#64dcb1" }}>
                    +${pos.carryPnL.toFixed(2)}
                  </td>
                  <td>
                    <span className={`pnl-badge ${isPos ? "pos" : "neg"}`}>
                      {isPos ? "+" : ""}${pos.netPnL.toFixed(2)}
                    </span>
                  </td>
                  <td className={pos.returnOnMarginPct >= 0 ? "pnl-pos" : "pnl-neg"}>
                    {pos.returnOnMarginPct >= 0 ? "+" : ""}{pos.returnOnMarginPct}%
                  </td>
                  <td>
                    <button
                      className="close-pos-btn"
                      onClick={() => onClosePosition && onClosePosition(pos.id)}
                      title="Close Position at Market Price"
                    >
                      Close [×]
                    </button>
                  </td>
                </tr>
              );
            })}
            {analyzedPositions.length === 0 && (
              <tr>
                <td colSpan="11" style={{ textAlign: "center", padding: "20px", color: "#647771" }}>
                  No open positions. Use the Order Ticket to execute simulated trades.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
