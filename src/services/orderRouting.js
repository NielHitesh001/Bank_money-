/**
 * Unified Multi-Broker Order Routing Engine
 * Routes order submissions through live risk guardrails and circuit breakers to Alpaca API or Internal Simulator.
 */

import { liveGuardrails } from "./liveExecutionGuardrails.js";
import { defaultAlpacaConnector } from "./brokers/alpacaConnector.js";
import { alpacaCircuitBreaker } from "./brokers/circuitBreaker.js";
import { immutableAuditLog } from "./auditLog/immutableAuditLog.js";

export async function routeOrderSubmission(orderParams, options = {}) {
  const {
    destination = "alpaca_paper", // "alpaca_paper" | "internal_sim"
    currentEquity = 1000000,
    dailyPnL = 0,
    positionVol = 0.02,
    user = "TRADER-01",
  } = options;

  // Step 1: Pre-Trade Risk Validation via Guardrails
  const validation = liveGuardrails.validateOrder(orderParams, currentEquity, dailyPnL, positionVol);
  if (!validation.approved) {
    await immutableAuditLog.logRiskGuardrailTriggered("PRE_TRADE_LIMIT", orderParams, validation.errors.join(" | "));
    return {
      status: "REJECTED",
      rejectionReason: validation.errors.join(" | "),
      errors: validation.errors,
      timestamp: new Date().toISOString(),
    };
  }

  // Step 2: Route to Execution Venue with Circuit Breaker Protection
  if (destination === "alpaca_paper" || destination === "alpaca_live") {
    return await alpacaCircuitBreaker.execute(
      // Primary: Alpaca API
      async () => {
        const alpacaFill = await defaultAlpacaConnector.submitOrder({
          symbol: orderParams.symbol,
          qty: orderParams.units,
          side: orderParams.side,
          type: orderParams.type,
          limitPrice: orderParams.executionPrice,
        });

        const receipt = {
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

        await immutableAuditLog.logOrderSubmission(receipt, user, true, "Broker Order Executed");
        return receipt;
      },
      // Fallback: Internal Paper Trading Engine on Broker Outage
      async (failoverContext) => {
        console.warn("⚠️ Broker failover triggered, routing to internal simulator:", failoverContext?.reason);

        const receipt = {
          status: "FILLED",
          venue: "INTERNAL_SIMULATOR (FAILOVER)",
          orderId: `SIM-FLV-${Date.now().toString().slice(-6)}`,
          symbol: orderParams.symbol,
          side: orderParams.side,
          filledUnits: orderParams.units,
          executionPrice: orderParams.executionPrice,
          notional: orderParams.notional,
          margin: orderParams.margin,
          leverage: orderParams.leverage,
          failoverReason: failoverContext?.reason,
          timestamp: new Date().toISOString(),
        };

        await immutableAuditLog.logOrderSubmission(receipt, user, true, `Broker Failover: ${failoverContext?.reason}`);
        return receipt;
      }
    );
  }

  // Direct Internal Simulator
  const receipt = {
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

  await immutableAuditLog.logOrderSubmission(receipt, user, true, "Internal Paper Trading");
  return receipt;
}
