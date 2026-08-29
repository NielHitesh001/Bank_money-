/**
 * Black-Scholes Greeks Engine & Multi-Asset Options Sensitivity
 * Computes Delta, Gamma, Vega, Theta, and Rho for derivatives & spot sensitivities.
 */

// Standard normal cumulative distribution approximation
function cdf(x) {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * absX);
  const erf = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * erf);
}

function pdf(x) {
  return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export function calculateBlackScholesGreeks(params = {}) {
  const {
    spot = 100,
    strike = 100,
    timeToExpiryYears = 0.25, // 3 months
    riskFreeRate = 0.05,
    volatility = 0.20,
    optionType = "CALL",
  } = params;

  const S = Math.max(spot, 0.001);
  const K = Math.max(strike, 0.001);
  const T = Math.max(timeToExpiryYears, 0.001);
  const r = riskFreeRate;
  const v = Math.max(volatility, 0.001);

  const d1 = (Math.log(S / K) + (r + 0.5 * v * v) * T) / (v * Math.sqrt(T));
  const d2 = d1 - v * Math.sqrt(T);

  const isCall = optionType.toUpperCase() === "CALL";
  const delta = isCall ? cdf(d1) : cdf(d1) - 1;
  const gamma = pdf(d1) / (S * v * Math.sqrt(T));
  const vega = (S * pdf(d1) * Math.sqrt(T)) / 100; // per 1% move in vol
  const theta = ((-(S * pdf(d1) * v) / (2 * Math.sqrt(T)) - (isCall ? 1 : -1) * r * K * Math.exp(-r * T) * cdf(isCall ? d2 : -d2))) / 365;
  const rho = ((isCall ? 1 : -1) * K * T * Math.exp(-r * T) * cdf(isCall ? d2 : -d2)) / 100;

  return {
    spot: S,
    strike: K,
    timeToExpiryYears: T,
    volatility: v,
    delta: Number(delta.toFixed(4)),
    gamma: Number(gamma.toFixed(4)),
    vega: Number(vega.toFixed(4)),
    theta: Number(theta.toFixed(4)),
    rho: Number(rho.toFixed(4)),
  };
}

export function aggregatePortfolioGreeks(positions = []) {
  let totalDelta = 0;
  let totalGamma = 0;
  let totalVega = 0;
  let totalTheta = 0;

  positions.forEach((p) => {
    const isEquityOrFx = p.assetClass === "FX" || p.assetClass === "Indices" || p.assetClass === "Commodities";
    const sign = p.side === "BUY" ? 1 : -1;
    const units = p.units || 1000;

    // Linear delta for cash/spot positions
    if (isEquityOrFx) {
      totalDelta += sign * units;
      totalGamma += 0;
      totalVega += (p.notional || 100000) * 0.01 * (sign * 0.05);
      totalTheta += -(p.notional || 100000) * (0.02 / 365);
    }
  });

  return {
    netDelta: Number(totalDelta.toFixed(0)),
    netGamma: Number(totalGamma.toFixed(2)),
    netVega: Number(totalVega.toFixed(2)),
    netTheta: Number(totalTheta.toFixed(2)),
  };
}
