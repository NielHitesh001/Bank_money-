/**
 * Real-Time Financial News & Economic Event Stream
 * Entity-tagged news wires with sentiment scoring and breaking alerts.
 */

export const INITIAL_NEWS_ITEMS = [
  {
    id: "NEWS-101",
    timestamp: "1 min ago",
    timeIso: new Date(Date.now() - 60000).toISOString(),
    headline: "Federal Reserve Signals Data-Dependent Neutral Rate Calibration Ahead of FOMC",
    summary: "Chair remarks indicate willingness to adjust balance sheet quantitative tightening (QT) velocity if bank reserve liquidity tightens.",
    source: "Bloomberg Wire",
    entities: ["FED", "US-FED", "USD", "JPM-US"],
    sentiment: "BULLISH",
    sentimentScore: +0.65,
    category: "Monetary Policy",
    breaking: true,
  },
  {
    id: "NEWS-102",
    timestamp: "5 mins ago",
    timeIso: new Date(Date.now() - 300000).toISOString(),
    headline: "BlackRock and Jio Financial Services Expand Asset Management Tech Infrastructure",
    summary: "Joint venture commits additional digital distribution capital across Indian Tier-1 and Tier-2 wealth channels via UPI interoperability.",
    source: "Reuters Financial",
    entities: ["BLACKROCK-US", "JIO-IN", "RELIANCE-IN", "INR"],
    sentiment: "BULLISH",
    sentimentScore: +0.82,
    category: "Corporate Action",
    breaking: false,
  },
  {
    id: "NEWS-103",
    timestamp: "12 mins ago",
    timeIso: new Date(Date.now() - 720000).toISOString(),
    headline: "European Central Bank Reviews TARGET2 Settlement Limits for Cross-Border Settlement",
    summary: "Governing Council monitors Eurozone interbank liquidity velocity as deposit facility rate adjustments take effect.",
    source: "Financial Times",
    entities: ["ECB", "TARGET2", "EUR", "DB-DE"],
    sentiment: "NEUTRAL",
    sentimentScore: +0.05,
    category: "Clearing Rails",
    breaking: false,
  },
  {
    id: "NEWS-104",
    timestamp: "24 mins ago",
    timeIso: new Date(Date.now() - 1440000).toISOString(),
    headline: "Gold Spot Tests $2,520 as Sovereign Central Banks Continue Record Reserve Buying",
    summary: "People's Bank of China, Reserve Bank of India, and Middle Eastern sovereign funds increase physical bullion allocations.",
    source: "Bloomberg Commodities",
    entities: ["XAU/USD", "GOLD", "PBOC", "RBI"],
    sentiment: "BULLISH",
    sentimentScore: +0.78,
    category: "Commodities",
    breaking: false,
  },
  {
    id: "NEWS-105",
    timestamp: "38 mins ago",
    timeIso: new Date(Date.now() - 2280000).toISOString(),
    headline: "Bank of Japan Affirms Gradual Policy Normalization Path; USD/JPY Dips Below 145.50",
    summary: "Governor Ueda highlights steady wage growth and domestic consumption as key catalysts for upcoming interest rate review.",
    source: "Nikkei Asia",
    entities: ["BOJ", "JPY", "USD/JPY"],
    sentiment: "BEARISH",
    sentimentScore: -0.45,
    category: "FX / Macro",
    breaking: false,
  },
  {
    id: "NEWS-106",
    timestamp: "52 mins ago",
    timeIso: new Date(Date.now() - 3120000).toISOString(),
    headline: "FinCEN Issues Advisory on Multi-Hop Corporate Layering in Offshore Free Zones",
    summary: "Financial intelligence unit emphasizes enhanced screening on correspondent banking corridors linking Baltic intermediaries to Middle East trade hubs.",
    source: "Regulatory Alert",
    entities: ["NORD-EE", "HARBOR-AE", "AML"],
    sentiment: "BEARISH",
    sentimentScore: -0.70,
    category: "AML Compliance",
    breaking: true,
  },
];

export function fetchMacroNews() {
  return INITIAL_NEWS_ITEMS;
}
