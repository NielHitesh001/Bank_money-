/**
 * Unified Multi-Broker Order Routing Engine
 * Routes order submissions through live risk guardrails to Alpaca API or Internal Paper Trading Simulator.
 */

import { liveGuardrails } from "./liveExecutionGuardrails.js";
import { defaultAlpacaConnector } from "./brokers/alpacaConnector.js";

export async function routeOrderSubmission(orderParams, options = {}) {
  const {
    destination = "alpaca_paper", // "alpaca_paper" | "internal_sim"
    currentEquity = 1000000,
    dailyPnL = 0,
    positionVol = 0.02,
  } = options;

  // Step 1: Pre-Trade Risk Validation via Guardrails
  const validation = liveGuardrails.validateOrder(orderParams, currentEquity, dailyPnL, positionVol);
  if (!validation.approved) {
    return {
      status: "REJECTED",
      rejectionReason: validation.errors.join(" | "),
      errors: validation.errors,
      timestamp: new Date().toISOString(),
    };
  }

  // Step 2: Route to Execution Venue
  try {
    if (destination === "alpaca_paper" || destination === "alpaca_live") {
      const alpacaFill = await defaultAlpacaConnector.submitOrder({
        symbol: orderParams.symbol,
        qty: orderParams.units,
        side: orderParams.side,
        type: orderParams.type,
        limitPrice: orderParams.executionPrice,
      });

      return {
        status: "FILLED",
        venue: "ALPACA",
        orderId: alpacaFill.id,
        symbol: orderParams.symbol,
        side: orderParams.side,
        filledUnits: Number(alpacaFill.filled_qty || orderParams.units),
        executionPrice: Number(alpacaFill.filled_avg_price || orderParams.executionPrice),
        notional: orderParams.notional,
        margin: orderParams.margin,
        leverage: orderParams.leverage,
        timestamp: alpacaFill.filled_at || new Date().toISOString(),
      };
    }

    // Default: Internal Paper Trading Engine
    return {
      status: "FILLED",
      venue: "INTERNAL_SIMULATOR",
      orderId: `SIM-ORD-${Date.now().toString().slice(-6)}`,
      symbol: orderParams.symbol,
      side: orderParams.side,
      filledUnits: orderParams.units,
      executionPrice: orderParams.executionPrice,
      notional: orderParams.notional,
      margin: orderParams.margin,
      leverage: orderParams.leverage,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      status: "REJECTED",
      venue: destination,
      rejectionReason: `Broker execution failure: ${err.message}`,
      timestamp: new Date().toISOString(),
    };
  }
}
