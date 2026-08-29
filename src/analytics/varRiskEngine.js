/**
 * Portfolio Value-at-Risk (VaR) & Stress Testing Engine
 */

export function calculatePortfolioVaR(positions, portfolioValue = 1000000) {
  // Aggregate total gross exposure
  const grossExposure = positions.reduce((acc, p) => acc + (p.notional || (p.units * p.entryPrice)), 0);

  // Asset class exposure weights
  const assetWeights = { FX: 0, Commodities: 0, Indices: 0, Crypto: 0, Bonds: 0 };
  positions.forEach((p) => {
    const cls = p.assetClass || "FX";
    const notional = p.notional || (p.units * p.entryPrice);
    assetWeights[cls] = (assetWeights[cls] || 0) + notional;
  });

  // Estimated portfolio weighted daily volatility (standard market defaults)
  const volMap = { FX: 0.005, Commodities: 0.012, Indices: 0.009, Crypto: 0.025, Bonds: 0.004 };
  let weightedVol = 0;
  if (grossExposure > 0) {
    Object.keys(assetWeights).forEach((cls) => {
      weightedVol += (assetWeights[cls] / grossExposure) * (volMap[cls] || 0.006);
    });
  } else {
    weightedVol = 0.006;
  }

  // Z-scores: 95% = 1.645, 99% = 2.326
  const var95_1d = Number((grossExposure * 1.645 * weightedVol).toFixed(0));
  const var99_1d = Number((grossExposure * 2.326 * weightedVol).toFixed(0));
  const var95_10d = Number((var95_1d * Math.sqrt(10)).toFixed(0));
  const var99_10d = Number((var99_1d * Math.sqrt(10)).toFixed(0));

  // Stress testing scenarios
  const stressScenarios = [
    {
      name: "Global Central Bank Shock (+100 bps)",
      impactPct: -2.4,
      lossUsd: Number((grossExposure * 0.024).toFixed(0)),
      severity: "Moderate",
      description: "Parallel yield curve upward shift across Fed, ECB, and BoE with carry unwinds.",
    },
    {
      name: "Dollar Liquidity Squeeze (USD +5% / EM -8%)",
      impactPct: -4.8,
      lossUsd: Number((grossExposure * 0.048).toFixed(0)),
      severity: "High",
      description: "Flight to US Treasuries and cross-currency basis widening in global clearing rails.",
    },
    {
      name: "Risk-Off Equity Drawdown (SPX -10% / VIX 35)",
      impactPct: -6.1,
      lossUsd: Number((grossExposure * 0.061).toFixed(0)),
      severity: "Severe",
      description: "Global equity liquidation and rapid carry trade unwind across Asian & EM corridors.",
    },
    {
      name: "Geopolitical Energy Shock (Crude Oil +25%)",
      impactPct: -3.5,
      lossUsd: Number((grossExposure * 0.035).toFixed(0)),
      severity: "Moderate",
      description: "Inflationary spike in commodity clearing channels affecting trade finance.",
    },
  ];

  return {
    portfolioValue,
    grossExposure,
    netExposure: Number((grossExposure * 0.75).toFixed(0)),
    dailyWeightedVolPct: Number((weightedVol * 100).toFixed(2)),
    var95_1d,
    var99_1d,
    var95_10d,
    var99_10d,
    var95Pct: grossExposure > 0 ? Number(((var95_1d / grossExposure) * 100).toFixed(2)) : 0,
    var99Pct: grossExposure > 0 ? Number(((var99_1d / grossExposure) * 100).toFixed(2)) : 0,
    stressScenarios,
  };
}
