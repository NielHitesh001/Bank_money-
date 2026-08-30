import React, { useState } from "react";
import { INITIAL_MARKET_TICKERS } from "../../../src/services/marketDataAggregator.js";

export default function LeftPanel({ selectedTicker, onSelectTicker }) {
  const [activeCategory, setActiveCategory] = useState("ALL");

  const categories = ["ALL", "FX", "Equities", "Crypto", "Commodities"];

  const filteredTickers = INITIAL_MARKET_TICKERS.filter((item) => {
    if (activeCategory === "ALL") return true;
    return item.assetClass === activeCategory;
  });

  return (
    <aside className="left-panel">
      <div className="left-panel__title">WATCHLIST & ASSET MATRIX</div>

      {/* Category selector */}
      <div className="left-panel__category-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`left-panel__tab ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tickers list */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {filteredTickers.map((t) => {
          const isSelected = selectedTicker?.symbol === t.symbol;
          const isPos = (t.pctChange || 0) >= 0;
          return (
            <div
              key={t.symbol}
              className={`left-panel__ticker-item ${isSelected ? "active" : ""}`}
              onClick={() => onSelectTicker && onSelectTicker(t)}
            >
              <div>
                <div className="left-panel__ticker-name">{t.symbol}</div>
                <div style={{ fontSize: "9px", color: "#555" }}>{t.assetClass}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="left-panel__ticker-price">${t.last.toFixed(t.decimals || 2)}</div>
                <div className={`left-panel__ticker-change ${isPos ? "" : "negative"}`}>
                  {isPos ? "+" : ""}{(t.pctChange || 0).toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
