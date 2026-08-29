/**
 * Trade & Portfolio PnL Attribution Engine
 * Decomposes profit & loss into Delta (Spot Move), Carry (Interest Accrual), Volatility, and Fees.
 */

export function attributeTradePnL(position, currentMarketPrice) {
  const {
    symbol,
    side, // "BUY" | "SELL"
    entryPrice,
    units,
    leverage = 1,
    carryRateAnnual = 0.0, // annualized % interest spread
    holdingDays = 1,
    feePaid = 0,
  } = position;

  const notional = units * entryPrice;
  const priceDiff = side === "BUY" ? currentMarketPrice - entryPrice : entryPrice - currentMarketPrice;

  // 1. Delta Spot PnL
  const spotPnL = Number((units * priceDiff).toFixed(2));

  // 2. Carry (Accrued Interest) PnL
  const carryPnL = Number((notional * (carryRateAnnual / 100) * (holdingDays / 365)).toFixed(2));

  // 3. Execution & Financing Cost
  const fees = Number(feePaid.toFixed(2));

  // 4. Net PnL
  const netPnL = Number((spotPnL + carryPnL - fees).toFixed(2));
  const returnOnMarginPct = position.margin > 0 ? Number(((netPnL / position.margin) * 100).toFixed(2)) : 0;

  return {
    symbol,
    entryPrice,
    currentPrice: currentMarketPrice,
    units,
    notional,
    spotPnL,
    carryPnL,
    fees,
    netPnL,
    returnOnMarginPct,
    attribution: {
      deltaPercent: netPnL !== 0 ? Number(((spotPnL / Math.abs(netPnL)) * 100).toFixed(1)) : 100,
      carryPercent: netPnL !== 0 ? Number(((carryPnL / Math.abs(netPnL)) * 100).toFixed(1)) : 0,
      feePercent: netPnL !== 0 ? Number(((-fees / Math.abs(netPnL)) * 100).toFixed(1)) : 0,
    },
  };
}
