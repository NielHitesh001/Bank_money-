/**
 * FX Carry Trade & Sovereign Rate Spread Analytics Model
 */

import { CENTRAL_BANKS_DATA } from "../../data/centralBanksData.js";

export function computeCarryTradeRankings() {
  const bankMap = new Map(CENTRAL_BANKS_DATA.map((b) => [b.currency, b]));
  const usdBank = bankMap.get("USD") || { rate: 5.25 };

  // Generate pairs vs USD and cross pairs
  const pairs = [
    { pair: "USD/JPY", base: "USD", quote: "JPY", spot: 145.43, vol: 9.8 },
    { pair: "USD/INR", base: "USD", quote: "INR", spot: 83.89, vol: 3.2 },
    { pair: "USD/BRL", base: "USD", quote: "BRL", spot: 5.56, vol: 12.4 },
    { pair: "USD/MXN", base: "USD", quote: "MXN", spot: 19.82, vol: 11.2 },
    { pair: "USD/CHF", base: "USD", quote: "CHF", spot: 0.8494, vol: 7.4 },
    { pair: "EUR/USD", base: "EUR", quote: "USD", spot: 1.0873, vol: 6.2 },
    { pair: "GBP/USD", base: "GBP", quote: "USD", spot: 1.3120, vol: 7.1 },
    { pair: "AUD/USD", base: "AUD", quote: "USD", spot: 0.6784, vol: 9.1 },
    { pair: "USD/TRY", base: "USD", quote: "TRY", spot: 34.05, vol: 18.5 },
    { pair: "USD/ZAR", base: "USD", quote: "ZAR", spot: 17.85, vol: 14.1 },
  ];

  return pairs.map((p) => {
    const baseBank = bankMap.get(p.base) || { rate: 5.25, country: p.base };
    const quoteBank = bankMap.get(p.quote) || { rate: 5.25, country: p.quote };

    // Spread = Long Rate - Short Rate
    const longBaseShortQuoteSpread = Number((baseBank.rate - quoteBank.rate).toFixed(2));
    const longQuoteShortBaseSpread = Number((quoteBank.rate - baseBank.rate).toFixed(2));

    const optimalDirection = longBaseShortQuoteSpread >= longQuoteShortBaseSpread ? "LONG_BASE" : "LONG_QUOTE";
    const bestSpread = Math.max(longBaseShortQuoteSpread, longQuoteShortBaseSpread);
    const carryToRisk = Number((bestSpread / (p.vol || 8.0)).toFixed(2));

    // Projected 1-year yield on $1,000,000 notional at 5x leverage
    const annualCarryYieldUsd = Number(((1000000 * 5 * (bestSpread / 100))).toFixed(0));

    return {
      pair: p.pair,
      base: p.base,
      quote: p.quote,
      baseRate: baseBank.rate,
      quoteRate: quoteBank.rate,
      spread: bestSpread,
      optimalDirection,
      directionLabel: optimalDirection === "LONG_BASE" ? `Long ${p.base} / Short ${p.quote}` : `Long ${p.quote} / Short ${p.base}`,
      impliedVol: p.vol,
      carryToRisk,
      annualYield5xUsd: annualCarryYieldUsd,
      signal: carryToRisk > 0.8 ? "STRONG_CARRY" : carryToRisk > 0.4 ? "MODERATE_CARRY" : "NEUTRAL",
    };
  }).sort((a, b) => b.carryToRisk - a.carryToRisk);
}
