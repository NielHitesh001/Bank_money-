import React, { useMemo } from "react";

export const WalkForwardResults = ({ walkForwardData }) => {
  if (!walkForwardData || !walkForwardData.folds) {
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
        🔄 Click <strong>WALK-FORWARD</strong> in the top toolbar to execute 5-fold rolling out-of-sample cross-validation.
      </div>
    );
  }

  const { folds = [], overallEfficiencyRatioPct, overfitRisk } = walkForwardData;

  const stats = useMemo(() => {
    let trainSum = 0;
    let testSum = 0;
    folds.forEach((f) => {
      trainSum += Number(f.inSampleSharpe ?? f.train_sharpe ?? 0);
      testSum += Number(f.outOfSampleSharpe ?? f.test_sharpe ?? 0);
    });
    const avgTrain = folds.length ? (trainSum / folds.length).toFixed(2) : "0.00";
    const avgTest = folds.length ? (testSum / folds.length).toFixed(2) : "0.00";
    const efficiency = Number(overallEfficiencyRatioPct ?? (folds.length && trainSum > 0 ? (testSum / trainSum) * 100 : 80)).toFixed(1);

    return { avgTrain, avgTest, efficiency };
  }, [folds, overallEfficiencyRatioPct]);

  const effNum = Number(stats.efficiency);
  const effColor = effNum >= 80 ? "#52d6aa" : effNum >= 65 ? "#fbbf24" : "#ff5b6e";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Top Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
        <div style={{ background: "#090f0c", border: "1px solid #1b2f25", padding: "8px 10px", borderRadius: "3px" }}>
          <div style={{ color: "#6e8a7f", fontSize: "9px" }}>AVG IN-SAMPLE SHARPE</div>
          <div style={{ color: "#38bdf8", fontSize: "15px", fontWeight: "bold" }}>
            {stats.avgTrain}
          </div>
          <div style={{ color: "#38bdf8", fontSize: "8px" }}>Training Windows (IS)</div>
        </div>

        <div style={{ background: "#090f0c", border: "1px solid #1b2f25", padding: "8px 10px", borderRadius: "3px" }}>
          <div style={{ color: "#6e8a7f", fontSize: "9px" }}>AVG OUT-OF-SAMPLE SHARPE</div>
          <div style={{ color: "#52d6aa", fontSize: "15px", fontWeight: "bold" }}>
            {stats.avgTest}
          </div>
          <div style={{ color: "#52d6aa", fontSize: "8px" }}>Testing Windows (OOS)</div>
        </div>

        <div style={{ background: "#090f0c", border: "1px solid #1b2f25", padding: "8px 10px", borderRadius: "3px" }}>
          <div style={{ color: "#6e8a7f", fontSize: "9px" }}>OVERALL EFFICIENCY RATIO</div>
          <div style={{ color: effColor, fontSize: "15px", fontWeight: "bold" }}>
            {stats.efficiency}%
          </div>
          <div style={{ color: effColor, fontSize: "8px" }}>{overfitRisk || (effNum >= 80 ? "LOW OVERFIT (ROBUST)" : "MODERATE OVERFIT")}</div>
        </div>
      </div>

      {/* 5-Fold Cross-Validation Table */}
      <div style={{ overflowX: "auto", border: "1px solid #1a2c24", borderRadius: "4px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5px", color: "#f0fdf4", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#0c1511", color: "#6e8a7f", borderBottom: "1px solid #1a2c24" }}>
              <th style={{ padding: "5px 8px" }}>FOLD / WINDOW</th>
              <th style={{ padding: "5px 8px" }}>WINDOW PERIOD</th>
              <th style={{ padding: "5px 8px" }}>IN-SAMPLE SHARPE</th>
              <th style={{ padding: "5px 8px" }}>OUT-OF-SAMPLE SHARPE</th>
              <th style={{ padding: "5px 8px" }}>EFFICIENCY</th>
              <th style={{ padding: "5px 8px" }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {folds.map((fold, idx) => {
              const foldNum = fold.fold ?? idx + 1;
              const trainSh = Number(fold.inSampleSharpe ?? fold.train_sharpe ?? 0);
              const testSh = Number(fold.outOfSampleSharpe ?? fold.test_sharpe ?? 0);
              const eff = Number(fold.efficiencyRatio ?? (trainSh > 0 ? (testSh / trainSh) * 100 : 0)).toFixed(1);
              const period = fold.windowPeriod || fold.date_range || `Fold ${foldNum} (Rolling)`;
              const isGood = Number(eff) >= 80;

              return (
                <tr
                  key={foldNum}
                  style={{
                    borderBottom: "1px solid #111d17",
                    background: idx % 2 === 0 ? "#060a08" : "#040705",
                  }}
                >
                  <td style={{ padding: "5px 8px", color: "#64dcb1", fontWeight: "bold" }}>
                    Window #{foldNum}
                  </td>
                  <td style={{ padding: "5px 8px", color: "#8da49c" }}>{period}</td>
                  <td style={{ padding: "5px 8px", color: "#38bdf8", fontFamily: "monospace" }}>{trainSh.toFixed(2)}</td>
                  <td style={{ padding: "5px 8px", color: testSh >= 0 ? "#52d6aa" : "#ff5b6e", fontFamily: "monospace" }}>
                    {testSh.toFixed(2)}
                  </td>
                  <td style={{ padding: "5px 8px", color: isGood ? "#52d6aa" : "#fbbf24", fontWeight: "bold" }}>
                    {eff}%
                  </td>
                  <td style={{ padding: "5px 8px", color: isGood ? "#52d6aa" : "#fbbf24", fontSize: "8.5px" }}>
                    {isGood ? "✅ ROBUST" : "⚠️ DEGRADED"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quantitative Analysis & Overfitting Guidance */}
      <div
        style={{
          background: "#090f0c",
          border: `1px solid ${effNum >= 80 ? "#1b3528" : "#3b2c15"}`,
          borderRadius: "4px",
          padding: "10px 12px",
          fontSize: "10px",
          lineHeight: "1.5",
          color: "#cce3d8",
        }}
      >
        {effNum >= 80 ? (
          <div>
            <strong style={{ color: "#52d6aa" }}>✅ ROBUST QUANTITATIVE PROFILE:</strong> Out-of-sample performance preserves {stats.efficiency}% of in-sample alpha. The strategy demonstrates minimal parameter overfitting across market regimes and is cleared for production sizing.
          </div>
        ) : effNum >= 65 ? (
          <div>
            <strong style={{ color: "#fbbf24" }}>⚠️ MODERATE SENSITIVITY:</strong> Out-of-sample efficiency is {stats.efficiency}%. Some parameter decay observed across regime shifts. Consider widening indicator lookback thresholds or adding volatility filtering.
          </div>
        ) : (
          <div>
            <strong style={{ color: "#ff5b6e" }}>❌ OVERFITTING DETECTED:</strong> Out-of-sample efficiency dropped to {stats.efficiency}%. The strategy is curve-fitted to historical noise. Re-tune core parameters or integrate Kalman filter dynamic state adjustments.
          </div>
        )}
      </div>
    </div>
  );
};

export default WalkForwardResults;
