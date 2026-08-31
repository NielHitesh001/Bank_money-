import React from "react";

export const TradesBlotter = ({ trades = [] }) => {
  if (!trades || trades.length === 0) {
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
        Run a backtest or select a strategy template to inspect executed trade blotter entries.
      </div>
    );
  }

  const winCount = trades.filter((t) => (t.pnl ?? 0) >= 0).length;
  const lossCount = trades.filter((t) => (t.pnl ?? 0) < 0).length;
  const winRate = trades.length ? ((winCount / trades.length) * 100).toFixed(1) : "0.0";
  const totalPnL = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Trades Table */}
      <div style={{ overflowX: "auto", border: "1px solid #1a2c24", borderRadius: "4px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5px", color: "#f0fdf4", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#0c1511", color: "#6e8a7f", borderBottom: "1px solid #1a2c24" }}>
              <th style={{ padding: "5px 8px" }}>#</th>
              <th style={{ padding: "5px 8px" }}>ENTRY TIME</th>
              <th style={{ padding: "5px 8px" }}>EXIT TIME</th>
              <th style={{ padding: "5px 8px" }}>ENTRY PX</th>
              <th style={{ padding: "5px 8px" }}>EXIT PX</th>
              <th style={{ padding: "5px 8px" }}>BARS</th>
              <th style={{ padding: "5px 8px" }}>P&L ($)</th>
              <th style={{ padding: "5px 8px" }}>P&L (%)</th>
              <th style={{ padding: "5px 8px" }}>REASON / TAG</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, i) => {
              const pnl = Number(trade.pnl ?? 0);
              const pnlPct = Number(trade.pnlPct ?? trade.pnl_pct ?? 0);
              const isWin = pnl >= 0;

              const entryTime = trade.entryDate || (trade.entry_ts ? new Date(trade.entry_ts * 1000).toLocaleDateString() : `#${i + 1}`);
              const exitTime = trade.exitDate || (trade.exit_ts ? new Date(trade.exit_ts * 1000).toLocaleDateString() : "-");
              const entryPx = trade.entryPrice ?? trade.entry_price ?? 0;
              const exitPx = trade.exitPrice ?? trade.exit_price ?? 0;
              const bars = trade.barsHeld ?? trade.bars_held ?? "-";
              const reason = trade.reason || trade.type || (isWin ? "PROFIT_TARGET" : "STOP_LOSS");

              return (
                <tr
                  key={trade.id || i}
                  style={{
                    borderBottom: "1px solid #111d17",
                    background: i % 2 === 0 ? "#060a08" : "#040705",
                  }}
                >
                  <td style={{ padding: "5px 8px", color: "#64dcb1", fontFamily: "monospace" }}>
                    {trade.id || i + 1}
                  </td>
                  <td style={{ padding: "5px 8px", color: "#8da49c" }}>{entryTime}</td>
                  <td style={{ padding: "5px 8px", color: "#8da49c" }}>{exitTime}</td>
                  <td style={{ padding: "5px 8px", fontFamily: "monospace" }}>${Number(entryPx).toFixed(2)}</td>
                  <td style={{ padding: "5px 8px", fontFamily: "monospace" }}>${Number(exitPx).toFixed(2)}</td>
                  <td style={{ padding: "5px 8px", color: "#6e8a7f" }}>{bars}</td>
                  <td style={{ padding: "5px 8px", color: isWin ? "#52d6aa" : "#ff5b6e", fontWeight: "bold", fontFamily: "monospace" }}>
                    {isWin ? "+$" : "-$"}{Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "5px 8px", color: isWin ? "#52d6aa" : "#ff5b6e", fontWeight: "bold" }}>
                    {isWin ? "+" : ""}{pnlPct.toFixed(2)}%
                  </td>
                  <td style={{ padding: "5px 8px", color: "#6e8a7f", fontSize: "8.5px" }}>{reason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Trades Summary Footer Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#0c1511",
          border: "1px solid #1a2c24",
          borderRadius: "4px",
          padding: "6px 12px",
          fontSize: "10px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", gap: "16px" }}>
          <span>
            TOTAL TRADES: <strong style={{ color: "#f0fdf4" }}>{trades.length}</strong>
          </span>
          <span>
            WINNING: <strong style={{ color: "#52d6aa" }}>{winCount}</strong>
          </span>
          <span>
            LOSING: <strong style={{ color: "#ff5b6e" }}>{lossCount}</strong>
          </span>
          <span>
            WIN RATE: <strong style={{ color: "#64dcb1" }}>{winRate}%</strong>
          </span>
        </div>
        <div>
          <span>
            TOTAL NET P&L:{" "}
            <strong style={{ color: totalPnL >= 0 ? "#52d6aa" : "#ff5b6e", fontSize: "11px" }}>
              {totalPnL >= 0 ? "+$" : "-$"}{Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TradesBlotter;
