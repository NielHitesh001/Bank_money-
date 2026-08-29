import React, { useMemo } from "react";
import { computeCarryTradeRankings } from "../../src/analytics/fxCarryModel.js";

export default function FxCarryAnalytics({ onSelectPair }) {
  const rankings = useMemo(() => computeCarryTradeRankings(), []);

  return (
    <div className="terminal-analytics-card">
      <div className="analytics-head">
        <div>
          <span className="eyebrow">SOVEREIGN POLICY SPREAD & CARRY RANKER</span>
          <h3>Global FX Carry Trade Matrix</h3>
        </div>
        <span className="analytics-badge">
          {rankings.length} Pairs Analyzed
        </span>
      </div>

      <div className="blotter-table-wrap" style={{ maxHeight: "320px" }}>
        <table className="bloomberg-table">
          <thead>
            <tr>
              <th>CURRENCY PAIR</th>
              <th>OPTIMAL DIRECTION</th>
              <th>RATE SPREAD</th>
              <th>IMPLIED VOL</th>
              <th>CARRY / RISK RATIO</th>
              <th>EST. ANNUAL YIELD ($1M @ 5x)</th>
              <th>CARRY SIGNAL</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((row) => (
              <tr key={row.pair} className="blotter-row">
                <td>
                  <strong style={{ color: "#38bdf8" }}>{row.pair}</strong>
                </td>
                <td>
                  <span className="direction-tag">{row.directionLabel}</span>
                </td>
                <td>
                  <span className="spread-pill">+{row.spread}%</span>
                </td>
                <td>{row.impliedVol}%</td>
                <td>
                  <strong style={{ color: row.carryToRisk > 0.6 ? "#64dcb1" : "#eab308" }}>
                    {row.carryToRisk}
                  </strong>
                </td>
                <td style={{ color: "#64dcb1", fontWeight: "700" }}>
                  +${row.annualYield5xUsd.toLocaleString()}
                </td>
                <td>
                  <span className={`signal-tag ${row.signal.toLowerCase()}`}>
                    ● {row.signal.replace("_", " ")}
                  </span>
                </td>
                <td>
                  <button
                    className="blotter-action-btn primary"
                    onClick={() => onSelectPair && onSelectPair(row.pair)}
                  >
                    Trade →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
