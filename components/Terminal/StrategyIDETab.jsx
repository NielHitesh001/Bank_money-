import React, { useEffect, useState } from "react";
import { STRATEGY_TEMPLATES, runQuantitativeBacktest } from "../../src/services/backtesterEngine.js";
import StrategyAssistant from "./StrategyAssistant.jsx";

export default function StrategyIDETab({ initialSymbol = "SPY" }) {
  const [selectedTemplate, setSelectedTemplate] = useState("mean_reversion");
  const [strategyCode, setStrategyCode] = useState(STRATEGY_TEMPLATES[0].code);
  const [symbol, setSymbol] = useState(initialSymbol);
  const [capital, setCapital] = useState(100000);
  const [commissionBps, setCommissionBps] = useState(5);
  const [slippageBps, setSlippageBps] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [backtestResults, setBacktestResults] = useState(null);
  const [activeRightTab, setActiveRightTab] = useState("results"); // "results" | "trades" | "assistant"

  // Load initial backtest on mount or symbol change
  useEffect(() => {
    handleRunBacktest();
  }, [symbol]);

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    const tmpl = STRATEGY_TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) {
      setStrategyCode(tmpl.code);
    }
  };

  const handleRunBacktest = async (codeToRun = strategyCode) => {
    setIsRunning(true);
    try {
      // Direct high-performance in-memory simulation with backend API fallback
      const results = runQuantitativeBacktest(codeToRun, {
        symbol,
        initialCapital: Number(capital),
        commission: Number(commissionBps) / 10000,
        slippage: Number(slippageBps) / 10000,
        preset: selectedTemplate,
      });
      setBacktestResults(results);
    } catch (err) {
      console.error("Backtest failed:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const equityData = backtestResults?.equityCurve || [];
  const minEquity = equityData.length ? Math.min(...equityData.map((d) => Math.min(d.equity, d.benchmark))) : 90000;
  const maxEquity = equityData.length ? Math.max(...equityData.map((d) => Math.max(d.equity, d.benchmark))) : 110000;
  const eqRange = maxEquity - minEquity || 1000;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "10px", padding: "10px 14px", boxSizing: "border-box" }}>
      {/* Top IDE Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#060a08", border: "1px solid #1a2c24", borderRadius: "4px", padding: "6px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "#64dcb1", fontSize: "11px", fontWeight: "bold" }}>
            💻 SYSTEMATIC TRADING IDE
          </span>
          <span style={{ color: "#486256", fontSize: "10px" }}>|</span>
          <label style={{ fontSize: "10px", color: "#8da49c", display: "flex", alignItems: "center", gap: "6px" }}>
            TEMPLATE:
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              style={{ background: "#0c1511", border: "1px solid #284437", color: "#f0fdf4", fontSize: "10px", padding: "2px 6px", borderRadius: "2px" }}
            >
              {STRATEGY_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: "10px", color: "#8da49c", display: "flex", alignItems: "center", gap: "6px" }}>
            ASSET:
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              style={{ width: "65px", background: "#0c1511", border: "1px solid #284437", color: "#64dcb1", fontSize: "10px", padding: "2px 6px", borderRadius: "2px", fontWeight: "bold" }}
            />
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "10px", color: "#8da49c" }}>
            CAPITAL: <strong style={{ color: "#f0fdf4" }}>${Number(capital).toLocaleString()}</strong>
          </span>
          <button
            onClick={() => handleRunBacktest()}
            disabled={isRunning}
            style={{
              background: isRunning ? "#1a2c24" : "#104f38",
              border: "1px solid #52d6aa",
              color: "#f0fdf4",
              fontSize: "10px",
              fontWeight: "bold",
              padding: "4px 12px",
              borderRadius: "3px",
              cursor: isRunning ? "wait" : "pointer",
              boxShadow: "0 0 10px rgba(82, 214, 170, 0.2)",
            }}
          >
            {isRunning ? "⚙️ COMPUTING..." : "⚡ RUN BACKTEST"}
          </button>
        </div>
      </div>

      {/* Main Split-View Workspace */}
      <div style={{ display: "grid", gridTemplateColumns: "48% 52%", gap: "10px", flex: 1, minHeight: "440px" }}>
        {/* Left Column: Python Strategy Editor */}
        <div style={{ display: "flex", flexDirection: "column", background: "#060a08", border: "1px solid #1a2c24", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ padding: "6px 10px", background: "#0c1511", borderBottom: "1px solid #1a2c24", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#f0fdf4", fontSize: "10.5px", fontFamily: "monospace" }}>
              📄 strategy.py <span style={{ color: "#5d726c" }}>(Python 3.11 Execution Context)</span>
            </span>
            <span style={{ color: "#64dcb1", fontSize: "9px" }}>● READY FOR SIMULATION</span>
          </div>

          <textarea
            value={strategyCode}
            onChange={(e) => setStrategyCode(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              background: "#030604",
              color: "#a7f3d0",
              fontFamily: "DM Mono, Menlo, monospace",
              fontSize: "11px",
              lineHeight: "1.5",
              padding: "10px",
              border: "none",
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
            }}
          />

          <div style={{ padding: "4px 10px", background: "#080e0b", borderTop: "1px solid #14221b", display: "flex", justifyContent: "space-between", fontSize: "9.5px", color: "#6e8a7f" }}>
            <span>Commission: {commissionBps} bps · Slippage: {slippageBps} bps</span>
            <span>Indicators: sma, rsi, ema, macd, kalman_filter, garch_forecast</span>
          </div>
        </div>

        {/* Right Column: Quantitative Performance & Copilot */}
        <div style={{ display: "flex", flexDirection: "column", background: "#060a08", border: "1px solid #1a2c24", borderRadius: "4px", overflow: "hidden" }}>
          {/* Right Sub-Tabs */}
          <div style={{ padding: "4px 8px", background: "#0c1511", borderBottom: "1px solid #1a2c24", display: "flex", gap: "6px" }}>
            {[
              { id: "results", label: "📊 PERFORMANCE & CURVE" },
              { id: "trades", label: `📜 EXECUTED TRADES (${backtestResults?.trades?.length || 0})` },
              { id: "assistant", label: "🤖 AI QUANT COPILOT" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveRightTab(tab.id)}
                style={{
                  background: activeRightTab === tab.id ? "#162820" : "transparent",
                  border: `1px solid ${activeRightTab === tab.id ? "#2a4a3b" : "transparent"}`,
                  color: activeRightTab === tab.id ? "#64dcb1" : "#718b80",
                  fontSize: "10px",
                  fontWeight: activeRightTab === tab.id ? "bold" : "normal",
                  padding: "4px 8px",
                  borderRadius: "3px",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
            {/* View 1: Performance Metrics & Equity Curve */}
            {activeRightTab === "results" && backtestResults && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* 6 Performance Metrics Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                  <div style={{ background: "#090f0c", border: "1px solid #1b2f25", padding: "6px 8px", borderRadius: "3px" }}>
                    <div style={{ color: "#6e8a7f", fontSize: "9px" }}>SHARPE RATIO</div>
                    <div style={{ color: "#64dcb1", fontSize: "14px", fontWeight: "bold" }}>
                      {backtestResults.metrics.sharpeRatio}
                    </div>
                    <div style={{ color: "#52d6aa", fontSize: "8px" }}>Annualized (252d)</div>
                  </div>

                  <div style={{ background: "#090f0c", border: "1px solid #1b2f25", padding: "6px 8px", borderRadius: "3px" }}>
                    <div style={{ color: "#6e8a7f", fontSize: "9px" }}>SORTINO RATIO</div>
                    <div style={{ color: "#38bdf8", fontSize: "14px", fontWeight: "bold" }}>
                      {backtestResults.metrics.sortinoRatio}
                    </div>
                    <div style={{ color: "#38bdf8", fontSize: "8px" }}>Downside deviation</div>
                  </div>

                  <div style={{ background: "#090f0c", border: "1px solid #1b2f25", padding: "6px 8px", borderRadius: "3px" }}>
                    <div style={{ color: "#6e8a7f", fontSize: "9px" }}>MAX DRAWDOWN</div>
                    <div style={{ color: "#ff5b6e", fontSize: "14px", fontWeight: "bold" }}>
                      -{backtestResults.metrics.maxDrawdownPct}%
                    </div>
                    <div style={{ color: "#ff5b6e", fontSize: "8px" }}>Peak-to-trough</div>
                  </div>

                  <div style={{ background: "#090f0c", border: "1px solid #1b2f25", padding: "6px 8px", borderRadius: "3px" }}>
                    <div style={{ color: "#6e8a7f", fontSize: "9px" }}>WIN RATE</div>
                    <div style={{ color: "#f0fdf4", fontSize: "14px", fontWeight: "bold" }}>
                      {backtestResults.metrics.winRatePct}%
                    </div>
                    <div style={{ color: "#8da49c", fontSize: "8px" }}>{backtestResults.trades.length} Closed Trades</div>
                  </div>

                  <div style={{ background: "#090f0c", border: "1px solid #1b2f25", padding: "6px 8px", borderRadius: "3px" }}>
                    <div style={{ color: "#6e8a7f", fontSize: "9px" }}>PROFIT FACTOR</div>
                    <div style={{ color: "#fbbf24", fontSize: "14px", fontWeight: "bold" }}>
                      {backtestResults.metrics.profitFactor}x
                    </div>
                    <div style={{ color: "#fbbf24", fontSize: "8px" }}>Gross Gain / Loss</div>
                  </div>

                  <div style={{ background: "#090f0c", border: "1px solid #1b2f25", padding: "6px 8px", borderRadius: "3px" }}>
                    <div style={{ color: "#6e8a7f", fontSize: "9px" }}>TOTAL RETURN</div>
                    <div style={{ color: backtestResults.totalReturnPct >= 0 ? "#52d6aa" : "#ff5b6e", fontSize: "14px", fontWeight: "bold" }}>
                      {backtestResults.totalReturnPct >= 0 ? "+" : ""}{backtestResults.totalReturnPct}%
                    </div>
                    <div style={{ color: "#8da49c", fontSize: "8px" }}>Net of Slippage & Fees</div>
                  </div>
                </div>

                {/* SVG Equity Curve Chart */}
                <div style={{ background: "#040705", border: "1px solid #14221b", borderRadius: "3px", padding: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", marginBottom: "4px" }}>
                    <span style={{ color: "#8da49c" }}>
                      📈 Cumulative Equity Curve (<strong style={{ color: "#52d6aa" }}>Strategy</strong> vs <span style={{ color: "#38bdf8" }}>Buy & Hold</span>)
                    </span>
                    <span style={{ color: "#64dcb1", fontWeight: "bold" }}>
                      Final: ${backtestResults.finalEquity.toLocaleString()}
                    </span>
                  </div>

                  <svg viewBox="0 0 440 130" style={{ width: "100%", height: "130px", display: "block" }}>
                    {/* Horizontal Gridlines */}
                    {[0.2, 0.5, 0.8].map((pct, idx) => (
                      <line key={idx} x1="10" y1={pct * 120} x2="430" y2={pct * 120} stroke="#111d17" strokeDasharray="2 3" />
                    ))}

                    {/* Benchmark Line (Blue) */}
                    <path
                      d={equityData
                        .map((pt, i) => {
                          const x = 10 + (i / (equityData.length - 1 || 1)) * 420;
                          const y = 110 - ((pt.benchmark - minEquity) / eqRange) * 95;
                          return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                      opacity="0.7"
                    />

                    {/* Strategy Equity Line (Green) */}
                    <path
                      d={equityData
                        .map((pt, i) => {
                          const x = 10 + (i / (equityData.length - 1 || 1)) * 420;
                          const y = 110 - ((pt.equity - minEquity) / eqRange) * 95;
                          return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#52d6aa"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                {/* Model Diagnostics Strip */}
                <div style={{ display: "flex", justifyContent: "space-between", background: "#0c1511", border: "1px solid #1b2f25", padding: "6px 10px", borderRadius: "3px", fontSize: "9px" }}>
                  <span>VOLATILITY REGIME: <strong style={{ color: "#64dcb1" }}>{backtestResults.regimeDiagnostics.volatilityState}</strong></span>
                  <span>KALMAN DRIFT: <strong style={{ color: "#38bdf8" }}>{backtestResults.regimeDiagnostics.kalmanDrift}</strong></span>
                  <span>STATUS: <strong style={{ color: "#52d6aa" }}>{backtestResults.regimeDiagnostics.alphaQualityScore}</strong></span>
                </div>
              </div>
            )}

            {/* View 2: Executed Trades Blotter */}
            {activeRightTab === "trades" && backtestResults && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5px", color: "#f0fdf4", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#0c1511", color: "#6e8a7f", borderBottom: "1px solid #1a2c24" }}>
                      <th style={{ padding: "4px 6px" }}>ID</th>
                      <th style={{ padding: "4px 6px" }}>ENTRY</th>
                      <th style={{ padding: "4px 6px" }}>EXIT</th>
                      <th style={{ padding: "4px 6px" }}>PRICE IN/OUT</th>
                      <th style={{ padding: "4px 6px" }}>PNL ($)</th>
                      <th style={{ padding: "4px 6px" }}>PNL (%)</th>
                      <th style={{ padding: "4px 6px" }}>REASON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backtestResults.trades.map((t) => (
                      <tr key={t.id} style={{ borderBottom: "1px solid #111d17" }}>
                        <td style={{ padding: "4px 6px", color: "#64dcb1", fontFamily: "monospace" }}>{t.id}</td>
                        <td style={{ padding: "4px 6px" }}>{t.entryDate}</td>
                        <td style={{ padding: "4px 6px" }}>{t.exitDate}</td>
                        <td style={{ padding: "4px 6px" }}>${t.entryPrice} → ${t.exitPrice}</td>
                        <td style={{ padding: "4px 6px", color: t.pnl >= 0 ? "#52d6aa" : "#ff5b6e", fontWeight: "bold" }}>
                          {t.pnl >= 0 ? "+$" : "-$"}{Math.abs(t.pnl).toLocaleString()}
                        </td>
                        <td style={{ padding: "4px 6px", color: t.pnlPct >= 0 ? "#52d6aa" : "#ff5b6e" }}>
                          {t.pnlPct >= 0 ? "+" : ""}{t.pnlPct}%
                        </td>
                        <td style={{ padding: "4px 6px", color: "#8da49c", fontSize: "8.5px" }}>{t.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* View 3: AI Quant Copilot Assistant */}
            {activeRightTab === "assistant" && (
              <StrategyAssistant
                symbol={symbol}
                currentStrategy={strategyCode}
                backtestResults={backtestResults}
                onApplyCode={(newCode) => {
                  setStrategyCode(newCode);
                  setActiveRightTab("results");
                  handleRunBacktest(newCode);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
