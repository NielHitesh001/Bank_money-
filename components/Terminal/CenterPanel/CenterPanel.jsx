import React from "react";
import RealTimeCandleChart from "../RealTimeCandleChart.jsx";
import BlotterGrid from "./BlotterGrid.jsx";

export default function CenterPanel({ selectedTicker, positions, onClosePosition }) {
  const symbol = selectedTicker?.symbol || "EUR/USD";

  return (
    <main className="center-panel">
      {/* Candlestick Chart Area - Fixed 290px */}
      <div className="chart-container">
        <RealTimeCandleChart symbol={symbol} />
      </div>

      {/* Blotter Grid Area - Internal scroll only */}
      <BlotterGrid positions={positions} onClosePosition={onClosePosition} />
    </main>
  );
}
