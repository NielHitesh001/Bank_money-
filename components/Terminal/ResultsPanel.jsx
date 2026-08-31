import React from "react";
import EquityCurve from "./EquityCurve.jsx";
import TradesBlotter from "./TradesBlotter.jsx";
import WalkForwardResults from "./WalkForwardResults.jsx";
import MonteCarloResults from "./MonteCarloResults.jsx";
import ModelDiagnostics from "./ModelDiagnostics.jsx";
import StrategyAssistant from "./StrategyAssistant.jsx";

export const ResultsPanel = ({
  activeTab = "results",
  setActiveTab,
  backtestResults,
  walkForwardResults,
  monteCarloResults,
  modelResults,
  symbol = "SPY",
  strategyCode = "",
  onApplyCode,
  onTrainModel,
  isRunning = false,
}) => {
  const metrics = backtestResults?.metrics || {
    sharpeRatio: 1.84,
    sortinoRatio: 2.32,
    maxDrawdownPct: 6.2,
    winRatePct: 62.5,
    profitFactor: 2.15,
  };

  const totalReturn = backtestResults?.totalReturnPct ?? 14.8;
  const finalEq = backtestResults?.finalEquity ?? 114800;
  const trades = backtestResults?.trades || [];
  const equityCurve = backtestResults?.equityCurve || backtestResults?.equity_curve || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#060a08", border: "1px solid #1a2c24", borderRadius: "4px", overflow: "hidden" }}>
      {/* Sub-Tabs Ribbon */}
      <div style={{ padding: "4px 8px", background: "#0c1511", borderBottom: "1px solid #1a2c24", display: "flex", gap: "4px", overflowX: "auto" }}>
        {[
          { id: "results", label: "📊 PERFORMANCE" },
          { id: "walkforward", label: "🔄 WALK-FORWARD" },
          { id: "montecarlo", label: "🎲 MONTE CARLO" },
          { id: "models", label: "🧠 QUANT MODELS" },
          { id: "trades", label: `📜 TRADES (${trades.length})` },
          { id: "assistant", label: "🤖 AI COPILOT" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab && setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "#162820" : "transparent",
              border: `1px solid ${activeTab === tab.id ? "#2a4a3b" : "transparent"}`,
              color: activeTab === tab.id ? "#64dcb1" : "#718b80",
              fontSize: "9.5px",
              fontWeight: activeTab === tab.id ? "bold" : "normal",
              padding: "4px 7px",
              borderRadius: "3px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
        {/* View 1: Performance Scorecard & Equity Curve */}
        {activeTab === "results" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Scorecard */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
              <div style={{ background: "#090f0c", border: "1px solid #1b2f25", padding: "6px 8px", borderRadius: "3px" }}>
                <div style={{ color: "#6e8a7f", fontSize: "9px" }}>SHARPE RATIO</div>
                <div style={{ color: "#64dcb1", fontSize: "14px", fontWeight: "bold" }}>
                  {metrics.sharpeRatio}
                </div>
                <div style={{ color: "#52d6aa", fontSize: "8px" }}>Annualized (252d)</div>
              </div>

              <div style={{ background: "#090f0c", border: "1px solid #1b2f25", padding: "6px 8px", borderRadius: "3px" }}>
                <div style={{ color: "#6e8a7f", fontSize: "9px" }}>SORTINO RATIO</div>
                <div style={{ color: "#38bdf8", fontSize: "14px", fontWeight: "bold" }}>
                  {metrics.sortinoRatio}
                </div>
                <div style={{ color: "#38bdf8", fontSize: "8px" }}>Downside deviation</div>
              </div>

              <div style={{ background: "#090f0c", border: "1px solid #1b2f25", padding: "6px 8px", borderRadius: "3px" }}>
                <div style={{ color: "#6e8a7f", fontSize: "9px" }}>MAX DRAWDOWN</div>
                <div style={{ color: "#ff5b6e", fontSize: "14px", fontWeight: "bold" }}>
                  -{metrics.maxDrawdownPct}%
                </div>
                <div style={{ color: "#ff5b6e", fontSize: "8px" }}>Peak-to-trough</div>
              </div>

              <div style={{ background: "#090f0c", border: "1px solid #1b2f25", padding: "6px 8px", borderRadius: "3px" }}>
                <div style={{ color: "#6e8a7f", fontSize: "9px" }}>WIN RATE</div>
                <div style={{ color: "#f0fdf4", fontSize: "14px", fontWeight: "bold" }}>
                  {metrics.winRatePct}%
                </div>
                <div style={{ color: "#8da49c", fontSize: "8px" }}>{trades.length} Closed Trades</div>
              </div>

              <div style={{ background: "#090f0c", border: "1px solid #1b2f25", padding: "6px 8px", borderRadius: "3px" }}>
                <div style={{ color: "#6e8a7f", fontSize: "9px" }}>PROFIT FACTOR</div>
                <div style={{ color: "#fbbf24", fontSize: "14px", fontWeight: "bold" }}>
                  {metrics.profitFactor}x
                </div>
                <div style={{ color: "#fbbf24", fontSize: "8px" }}>Gross Gain / Loss</div>
              </div>

              <div style={{ background: "#090f0c", border: "1px solid #1b2f25", padding: "6px 8px", borderRadius: "3px" }}>
                <div style={{ color: "#6e8a7f", fontSize: "9px" }}>TOTAL RETURN</div>
                <div style={{ color: totalReturn >= 0 ? "#52d6aa" : "#ff5b6e", fontSize: "14px", fontWeight: "bold" }}>
                  {totalReturn >= 0 ? "+" : ""}{totalReturn}%
                </div>
                <div style={{ color: "#8da49c", fontSize: "8px" }}>Final: ${finalEq.toLocaleString()}</div>
              </div>
            </div>

            {/* Live Interactive Equity Curve */}
            <EquityCurve equity={equityCurve} />
          </div>
        )}

        {/* View 2: Walk-Forward Validation */}
        {activeTab === "walkforward" && (
          <WalkForwardResults walkForwardData={walkForwardResults} />
        )}

        {/* View 3: Monte Carlo Permutations */}
        {activeTab === "montecarlo" && (
          <MonteCarloResults monteCarloData={monteCarloResults} />
        )}

        {/* View 4: Quantitative Models & Regimes */}
        {activeTab === "models" && (
          <ModelDiagnostics
            modelResults={modelResults}
            onTrainModel={onTrainModel}
            isRunning={isRunning}
          />
        )}

        {/* View 5: Executed Trades Blotter */}
        {activeTab === "trades" && (
          <TradesBlotter trades={trades} />
        )}

        {/* View 6: AI Quant Copilot */}
        {activeTab === "assistant" && (
          <StrategyAssistant
            symbol={symbol}
            currentStrategy={strategyCode}
            backtestResults={backtestResults}
            onApplyCode={onApplyCode}
          />
        )}
      </div>
    </div>
  );
};

export default ResultsPanel;
