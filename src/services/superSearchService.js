/**
 * Super Search Context-Shift Engine
 * Resolves tickers, entities, macro institutions, and aggregates market, news,
 * holdings, and risk metrics into a single unified dossier.
 */

import { getEntities, getTransactions } from "./intelligenceService.js";
import { getMarketTickers } from "./marketDataAggregator.js";
import { fetchMacroNews } from "./newsService.js";
import { calculatePortfolioVaR } from "../analytics/varRiskEngine.js";

// Mapping of common equity tickers to institutional entity graph IDs
const TICKER_ENTITY_MAP = {
  AAPL: "REG-US-0011",
  MSFT: "REG-US-0012",
  NVDA: "REG-US-0013",
  AMZN: "REG-US-0014",
  GOOGL: "REG-US-0015",
  META: "REG-US-0016",
  TSLA: "REG-US-0017",
  JPM: "GSIB-JPM-US",
  BAC: "GSIB-BAC-US",
  HSBC: "GSIB-HSBC-UK",
  DB: "GSIB-DB-DE",
  UBS: "GSIB-UBS-CH",
  BLK: "AM-BLK-US",
  VAN: "AM-VAN-US",
  SPY: "AM-BLK-US",
  QQQ: "AM-VAN-US",
  "BTC/USD": "REG-US-0018",
  "EUR/USD": "CB-ECB-EU",
  "GBP/USD": "CB-BOE-UK",
  "USD/JPY": "CB-BOJ-JP",
  "USD/INR": "CB-RBI-IN",
  FED: "CB-FED-US",
  ECB: "CB-ECB-EU",
  BOE: "CB-BOE-UK",
  BOJ: "CB-BOJ-JP",
  RBI: "CB-RBI-IN",
};

export function getSearchSuggestions(query = "") {
  if (!query || query.trim().length === 0) return [];
  const q = query.trim().toUpperCase();
  const suggestions = [];

  // 1. Check Tickers
  const tickers = getMarketTickers();
  Object.keys(tickers).forEach((sym) => {
    if (sym.includes(q)) {
      suggestions.push({
        type: "TICKER",
        id: sym,
        title: sym,
        subtitle: `Market Asset · $${tickers[sym].price.toFixed(2)}`,
        symbol: sym,
      });
    }
  });

  // 2. Check 274 Entities
  const entities = getEntities();
  entities.forEach((ent) => {
    if (
      ent.name.toUpperCase().includes(q) ||
      ent.id.toUpperCase().includes(q) ||
      (ent.lei && ent.lei.toUpperCase().includes(q)) ||
      (ent.swiftBic && ent.swiftBic.toUpperCase().includes(q))
    ) {
      suggestions.push({
        type: "ENTITY",
        id: ent.id,
        title: ent.name,
        subtitle: `${ent.category || ent.type} · ${ent.countryCode || ent.country} · ${ent.rating || "N/A"}`,
        symbol: Object.keys(TICKER_ENTITY_MAP).find((k) => TICKER_ENTITY_MAP[k] === ent.id) || "SPY",
      });
    }
  });

  return suggestions.slice(0, 10);
}

export function resolveEntityDossier(query = "SPY") {
  const cleanQ = query.trim().toUpperCase();
  const tickers = getMarketTickers();

  // Determine Symbol & Entity ID
  let symbol = cleanQ;
  let entityId = TICKER_ENTITY_MAP[cleanQ] || cleanQ;

  // If query is an entity ID (e.g. GSIB-JPM-US)
  const allEntities = getEntities();
  let matchedEntity = allEntities.find((e) => e.id.toUpperCase() === entityId || e.id.toUpperCase() === cleanQ);

  if (!matchedEntity) {
    // Try matching by name
    matchedEntity = allEntities.find((e) => e.name.toUpperCase().includes(cleanQ)) || allEntities[0];
    if (matchedEntity) entityId = matchedEntity.id;
  }

  // Live Market Data
  const tick = tickers[symbol] || tickers["SPY"] || { price: 580.25, changePct: 0.45, bid: 580.20, ask: 580.30, high: 582.00, low: 578.50, volume: 45000000 };

  // Counterparty Relationships & Clearing Edges
  const allTx = getTransactions();
  const relationships = allTx.filter(
    (t) => t.sourceId === entityId || t.targetId === entityId || t.source === entityId || t.target === entityId
  ).slice(0, 8);

  // Relevant News Feed
  const allNews = fetchMacroNews();
  const relevantNews = allNews.filter(
    (n) => n.headline.toUpperCase().includes(cleanQ) || n.summary.toUpperCase().includes(cleanQ) || (matchedEntity && n.summary.toUpperCase().includes(matchedEntity.name.toUpperCase()))
  );

  // Risk & VaR Metrics
  const mockPosition = [{ symbol, units: 100, entryPrice: tick.price, currentPrice: tick.price, side: "BUY" }];
  const varProfile = calculatePortfolioVaR(mockPosition, 100000);

  return {
    query: cleanQ,
    symbol,
    entity: matchedEntity || {
      id: entityId,
      name: `${cleanQ} Global Asset`,
      type: "EQUITY_INSTRUMENT",
      category: "Exchange Traded",
      countryCode: "US",
      rating: "AAA",
      riskScore: 15,
      tier1Ratio: 14.5,
      lei: "549300V52G8C7G32T377",
      swiftBic: "CHASUS33",
      status: "ACTIVE",
    },
    market: {
      price: tick.price,
      changePct: tick.changePct,
      bid: tick.bid,
      ask: tick.ask,
      spread: tick.spread || 0.05,
      high: tick.high || tick.price * 1.01,
      low: tick.low || tick.price * 0.99,
      volume: tick.volume || 1000000,
    },
    counterparties: relationships,
    news: relevantNews.length > 0 ? relevantNews : allNews.slice(0, 4),
    risk: {
      var95: varProfile.var95Amount || 1250,
      var99: varProfile.var99Amount || 2450,
      riskLevel: (matchedEntity?.riskScore || 20) > 50 ? "HIGH" : "MODERATE",
      shocks: varProfile.stressScenarios || [],
    },
  };
}
