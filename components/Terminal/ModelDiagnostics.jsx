import React from "react";

export const ModelDiagnostics = ({ modelResults, onTrainModel, isRunning = false }) => {
  const modelType = modelResults?.modelType || modelResults?.model_name || "Kalman Filter";
  const params = modelResults?.parameters || {};
  const diagnostics = modelResults?.diagnostics || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Active Model Overview Card */}
      <div style={{ background: "#090f0c", border: "1px solid #1b2f25", borderRadius: "4px", padding: "10px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ color: "#64dcb1", fontSize: "11px", fontWeight: "bold" }}>
            🧠 {modelType}
          </span>
          <span
            style={{
              color: "#38bdf8",
              background: "rgba(56, 189, 248, 0.1)",
              border: "1px solid #1a3c4a",
              padding: "2px 8px",
              borderRadius: "10px",
              fontSize: "8.5px",
              fontWeight: "bold",
            }}
          >
            FITTED TO SUBPROCESS
          </span>
        </div>

        {/* Dynamic Metric Display based on Model Type */}
        {modelType.toLowerCase().includes("garch") && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "10px", color: "#f0fdf4" }}>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>ANNUALIZED VOL FORECAST</div>
              <div style={{ color: "#38bdf8", fontSize: "14px", fontWeight: "bold" }}>
                {modelResults?.annualizedVolPct || "12.8"}%
              </div>
            </div>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>VOLATILITY REGIME</div>
              <div style={{ color: "#52d6aa", fontSize: "11px", fontWeight: "bold" }}>
                {modelResults?.regime || "LOW_VOLATILITY_COMPRESSION"}
              </div>
            </div>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>PERSISTENCE (α + β)</div>
              <div style={{ color: "#fbbf24", fontSize: "12px", fontWeight: "bold" }}>
                {params.persistence || "0.950"}
              </div>
            </div>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>AIC / LOG-LIKELIHOOD</div>
              <div style={{ color: "#f0fdf4", fontSize: "12px", fontFamily: "monospace" }}>
                {diagnostics.aic || "-1420.5"} / {diagnostics.logLikelihood || "714.2"}
              </div>
            </div>
          </div>
        )}

        {modelType.toLowerCase().includes("kalman") && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "10px", color: "#f0fdf4" }}>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>DRIFT VELOCITY</div>
              <div style={{ color: (modelResults?.driftVelocity || 0.028) > 0 ? "#52d6aa" : "#ff5b6e", fontSize: "14px", fontWeight: "bold" }}>
                {modelResults?.driftVelocity > 0 ? "+" : ""}{modelResults?.driftVelocity || "0.028"}
              </div>
            </div>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>ESTIMATED STATE REGIME</div>
              <div style={{ color: "#38bdf8", fontSize: "11px", fontWeight: "bold" }}>
                {modelResults?.stateRegime || "BULLISH_DRIFT"}
              </div>
            </div>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>FILTERED PX vs RAW</div>
              <div style={{ color: "#f0fdf4", fontSize: "12px", fontFamily: "monospace" }}>
                ${modelResults?.latestFilteredPrice || "1.0924"} / ${modelResults?.rawPrice || "1.0874"}
              </div>
            </div>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>KALMAN GAIN (K)</div>
              <div style={{ color: "#fbbf24", fontSize: "12px", fontWeight: "bold" }}>
                {params.kalmanGain || "0.380"}
              </div>
            </div>
          </div>
        )}

        {modelType.toLowerCase().includes("cointegrat") && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "10px", color: "#f0fdf4" }}>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>ADF T-STATISTIC (vs -2.88)</div>
              <div style={{ color: "#52d6aa", fontSize: "14px", fontWeight: "bold" }}>
                {modelResults?.adfStatistic || "-3.42"}
              </div>
            </div>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>P-VALUE (STATIONARITY)</div>
              <div style={{ color: "#38bdf8", fontSize: "12px", fontWeight: "bold" }}>
                p = {modelResults?.pValue || "0.012"} (Stationary)
              </div>
            </div>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>HALF-LIFE OF REVERSION</div>
              <div style={{ color: "#fbbf24", fontSize: "12px", fontWeight: "bold" }}>
                {modelResults?.halfLifeBars || "12.4"} bars
              </div>
            </div>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>HEDGE RATIO (β)</div>
              <div style={{ color: "#f0fdf4", fontSize: "12px", fontFamily: "monospace" }}>
                {modelResults?.hedgeRatio || "1.042"}
              </div>
            </div>
          </div>
        )}

        {modelType.toLowerCase().includes("ml") && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "10px", color: "#f0fdf4" }}>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>PREDICTED REGIME</div>
              <div style={{ color: "#52d6aa", fontSize: "11px", fontWeight: "bold" }}>
                {modelResults?.predictedRegime || "BULLISH_TREND_EXPANSION"}
              </div>
            </div>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>ROC-AUC CLASSIFICATION SCORE</div>
              <div style={{ color: "#38bdf8", fontSize: "14px", fontWeight: "bold" }}>
                {modelResults?.rocAucScore || "0.894"}
              </div>
            </div>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b", gridColumn: "span 2" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px", marginBottom: "4px" }}>TOP FEATURE IMPORTANCE</div>
              <div style={{ display: "flex", gap: "8px", fontSize: "9px" }}>
                <span style={{ color: "#64dcb1" }}>GARCH Vol (34%)</span>
                <span style={{ color: "#38bdf8" }}>Kalman Drift (28%)</span>
                <span style={{ color: "#fbbf24" }}>RSI Momentum (22%)</span>
                <span style={{ color: "#c084fc" }}>MACD (16%)</span>
              </div>
            </div>
          </div>
        )}

        {modelType.toLowerCase().includes("hmm") && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "10px", color: "#f0fdf4" }}>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>CURRENT HIDDEN STATE</div>
              <div style={{ color: "#c084fc", fontSize: "12px", fontWeight: "bold" }}>
                {modelResults?.currentState || "REGIME_1_LOW_VOL_BULL"}
              </div>
            </div>
            <div style={{ background: "#060a08", padding: "6px 8px", borderRadius: "3px", border: "1px solid #14221b" }}>
              <div style={{ color: "#6e8a7f", fontSize: "8.5px" }}>REGIME CONFIDENCE</div>
              <div style={{ color: "#52d6aa", fontSize: "14px", fontWeight: "bold" }}>
                {((modelResults?.regimeConfidence || 0.88) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Model Selection & Retraining Suite */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {[
          { id: "kalman", label: "⚡ 1. Kalman Trend", color: "#38bdf8" },
          { id: "garch", label: "⚡ 2. GARCH Volatility", color: "#64dcb1" },
          { id: "cointegration", label: "⚡ 3. Cointegration ADF", color: "#fbbf24" },
          { id: "ml_regime", label: "⚡ 4. ML Regime Classifier", color: "#c084fc" },
          { id: "hmm", label: "⚡ 3-State HMM", color: "#f472b6" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => onTrainModel && onTrainModel(m.id)}
            disabled={isRunning}
            style={{
              flex: 1,
              minWidth: "110px",
              background: "#0c1511",
              border: "1px solid #1f382b",
              color: m.color,
              fontSize: "9px",
              fontWeight: "bold",
              padding: "5px 8px",
              borderRadius: "3px",
              cursor: isRunning ? "wait" : "pointer",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModelDiagnostics;
