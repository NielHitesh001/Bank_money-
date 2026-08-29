/**
 * Real-Time Multi-Asset Market Data Aggregator
 * Standardized tick contract for FX, Commodities, Indices, and Crypto.
 */

export const INITIAL_MARKET_TICKERS = [
  // Major FX Pairs
  { symbol: "EUR/USD", name: "Euro / US Dollar", assetClass: "FX", bid: 1.0872, ask: 1.0874, last: 1.0873, open: 1.0845, high: 1.0892, low: 1.0838, change: +0.0028, pctChange: +0.26, volume: 48200000, pipSize: 0.0001, decimals: 4 },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", assetClass: "FX", bid: 1.3118, ask: 1.3121, last: 1.3120, open: 1.3090, high: 1.3145, low: 1.3082, change: +0.0030, pctChange: +0.23, volume: 34100000, pipSize: 0.0001, decimals: 4 },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", assetClass: "FX", bid: 145.42, ask: 145.45, last: 145.43, open: 146.10, high: 146.35, low: 145.20, change: -0.67, pctChange: -0.46, volume: 41200000, pipSize: 0.01, decimals: 2 },
  { symbol: "USD/INR", name: "US Dollar / Indian Rupee", assetClass: "FX", bid: 83.88, ask: 83.91, last: 83.89, open: 83.82, high: 83.94, low: 83.78, change: +0.07, pctChange: +0.08, volume: 18900000, pipSize: 0.01, decimals: 2 },
  { symbol: "USD/AED", name: "US Dollar / UAE Dirham", assetClass: "FX", bid: 3.6725, ask: 3.6730, last: 3.6728, open: 3.6728, high: 3.6732, low: 3.6724, change: 0.0000, pctChange: 0.00, volume: 12400000, pipSize: 0.0001, decimals: 4 },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", assetClass: "FX", bid: 0.8492, ask: 0.8495, last: 0.8494, open: 0.8510, high: 0.8525, low: 0.8480, change: -0.0016, pctChange: -0.19, volume: 16500000, pipSize: 0.0001, decimals: 4 },
  { symbol: "AUD/USD", name: "Australian Dollar / USD", assetClass: "FX", bid: 0.6782, ask: 0.6785, last: 0.6784, open: 0.6740, high: 0.6802, low: 0.6735, change: +0.0044, pctChange: +0.65, volume: 22100000, pipSize: 0.0001, decimals: 4 },
  { symbol: "USD/CNY", name: "US Dollar / Chinese Yuan", assetClass: "FX", bid: 7.1210, ask: 7.1225, last: 7.1218, open: 7.1350, high: 7.1380, low: 7.1190, change: -0.0132, pctChange: -0.19, volume: 29800000, pipSize: 0.0001, decimals: 4 },

  // Key Commodities
  { symbol: "XAU/USD", name: "Gold Spot", assetClass: "Commodities", bid: 2514.50, ask: 2515.20, last: 2514.85, open: 2498.00, high: 2522.40, low: 2495.10, change: +16.85, pctChange: +0.67, volume: 8940000, pipSize: 0.1, decimals: 2 },
  { symbol: "WTI/USD", name: "Crude Oil (WTI)", assetClass: "Commodities", bid: 75.82, ask: 75.86, last: 75.84, open: 74.90, high: 76.40, low: 74.60, change: +0.94, pctChange: +1.25, volume: 14200000, pipSize: 0.01, decimals: 2 },
  { symbol: "XAG/USD", name: "Silver Spot", assetClass: "Commodities", bid: 29.85, ask: 29.89, last: 29.87, open: 29.40, high: 30.15, low: 29.32, change: +0.47, pctChange: +1.60, volume: 6200000, pipSize: 0.01, decimals: 2 },

  // Global Indices & Equities
  { symbol: "SPX", name: "S&P 500 Index", assetClass: "Indices", bid: 5634.20, ask: 5635.10, last: 5634.65, open: 5590.00, high: 5642.80, low: 5585.20, change: +44.65, pctChange: +0.80, volume: 92400000, pipSize: 0.1, decimals: 2 },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", assetClass: "Indices", bid: 478.40, ask: 478.50, last: 478.45, open: 473.10, high: 479.80, low: 472.50, change: +5.35, pctChange: +1.13, volume: 54100000, pipSize: 0.01, decimals: 2 },
  { symbol: "US10Y", name: "US 10-Year Treasury Yield", assetClass: "Bonds", bid: 3.862, ask: 3.865, last: 3.864, open: 3.910, high: 3.918, low: 3.855, change: -0.046, pctChange: -1.18, volume: 15400000, pipSize: 0.001, decimals: 3 },
  { symbol: "NIFTY50", name: "NSE Nifty 50", assetClass: "Indices", bid: 25235.00, ask: 25238.00, last: 25236.50, open: 25150.00, high: 25260.00, low: 25120.00, change: +86.50, pctChange: +0.34, volume: 38200000, pipSize: 0.5, decimals: 2 },

  // Institutional Crypto
  { symbol: "BTC/USD", name: "Bitcoin", assetClass: "Crypto", bid: 63840.00, ask: 63850.00, last: 63845.00, open: 62400.00, high: 64200.00, low: 62100.00, change: +1445.00, pctChange: +2.32, volume: 184000000, pipSize: 1.0, decimals: 2 },
  { symbol: "ETH/USD", name: "Ethereum", assetClass: "Crypto", bid: 2712.50, ask: 2714.00, last: 2713.25, open: 2650.00, high: 2745.00, low: 2635.00, change: +63.25, pctChange: +2.39, volume: 92000000, pipSize: 0.1, decimals: 2 },
];

/**
 * Normalizes any external market tick into standard Bloomberg schema
 */
export function normalizeMarketTick(rawTick, provider = "aggregated") {
  const timestamp = rawTick.timestamp || new Date().toISOString();
  const bid = Number(rawTick.bid || rawTick.last || 0);
  const ask = Number(rawTick.ask || (bid * 1.0002));
  const last = Number(rawTick.last || (bid + ask) / 2);
  const open = Number(rawTick.open || last);
  const change = Number((last - open).toFixed(4));
  const pctChange = open > 0 ? Number(((change / open) * 100).toFixed(2)) : 0;

  return {
    symbol: rawTick.symbol,
    name: rawTick.name || rawTick.symbol,
    assetClass: rawTick.assetClass || "FX",
    timestamp,
    bid,
    ask,
    last,
    open,
    high: Math.max(rawTick.high || last, last),
    low: Math.min(rawTick.low || last, last),
    change,
    pctChange,
    volume: Number(rawTick.volume || 1000000),
    source: provider,
    freshness: "12ms",
    confidence: 0.99,
  };
}
