import React, { useMemo } from "react";
import { calculatePortfolioVaR } from "../../src/analytics/varRiskEngine.js";

export default function RiskVaRPanel({ positions = [] }) {
  const riskMetrics = useMemo(() => calculatePortfolioVaR(positions), [positions]);

  return (
    <div className="terminal-risk-card">
      <div className="analytics-head">
        <div>
          <span className="eyebrow">PORTFOLIO VALUE-AT-RISK & STRESS TESTING</span>
          <h3>Cross-Asset Risk & Capital Limits</h3>
        </div>
        <span className="analytics-badge">
          Daily Vol: {riskMetrics.dailyWeightedVolPct}%
        </span>
      </div>

      {/* VaR Metrics Grid */}
      <div className="var-metrics-grid">
        <div className="var-metric-box">
          <span className="var-label">1-DAY VaR (95% CONFIDENCE)</span>
          <strong className="var-val">${riskMetrics.var95_1d.toLocaleString()}</strong>
          <small className="var-pct">{riskMetrics.var95Pct}% of Gross Exposure</small>
        </div>

        <div className="var-metric-box danger">
          <span className="var-label">1-DAY VaR (99% CONFIDENCE)</span>
          <strong className="var-val">${riskMetrics.var99_1d.toLocaleString()}</strong>
          <small className="var-pct">{riskMetrics.var99Pct}% of Gross Exposure</small>
        </div>

        <div className="var-metric-box">
          <span className="var-label">10-DAY VaR (95% BASEL III)</span>
          <strong className="var-val">${riskMetrics.var95_10d.toLocaleString()}</strong>
          <small className="var-pct">Regulatory Liquidity Horizon</small>
        </div>

        <div className="var-metric-box danger">
          <span className="var-label">10-DAY VaR (99% TAIL RISK)</span>
          <strong className="var-val">${riskMetrics.var99_10d.toLocaleString()}</strong>
          <small className="var-pct">Extreme Stress Horizon</small>
        </div>
      </div>

      {/* Stress Testing Scenarios */}
      <div className="stress-scenarios-section">
        <div className="stress-title">
          <span>HYPOTHETICAL SHOCK SIMULATION SCENARIOS</span>
          <small>Estimated Mark-to-Market Loss</small>
        </div>

        <div className="stress-list">
          {riskMetrics.stressScenarios.map((sc, i) => (
            <div key={i} className="stress-row">
              <div className="stress-left">
                <span className={`severity-dot ${sc.severity.toLowerCase()}`} />
                <div>
                  <strong>{sc.name}</strong>
                  <p>{sc.description}</p>
                </div>
              </div>
              <div className="stress-right">
                <strong className="stress-loss">-${sc.lossUsd.toLocaleString()}</strong>
                <span className="stress-pct">({sc.impactPct}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
