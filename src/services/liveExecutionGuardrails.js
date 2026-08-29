/**
 * Live Execution Risk Guardrails & Circuit Breaker Engine
 * Pre-trade risk enforcement, daily drawdown stops, leverage caps, and emergency kill switches.
 */

export class LiveExecutionGuardrails {
  constructor(config = {}) {
    this.maxNotionalPerOrder = config.maxNotionalPerOrder || 50000; // $50k max per order
    this.maxDailyLossThreshold = config.maxDailyLossThreshold || -100000; // -$100k daily stop
    this.maxLeverageAllowed = config.maxLeverageAllowed || 5; // 5x max live leverage
    this.volatilityKillThreshold = config.volatilityKillThreshold || 0.08; // 8% daily vol cap
    this.paused = false;
    this.auditLog = [];
  }

  validateOrder(order, currentEquity = 1000000, dailyPnL = 0, positionVol = 0.02) {
    const errors = [];

    // 1. Emergency Kill Switch Check
    if (this.paused) {
      errors.push("🛑 EMERGENCY KILL SWITCH ACTIVE: All live order submissions are halted.");
    }

    // 2. Per-Order Notional Limit
    if (order.notional > this.maxNotionalPerOrder) {
      errors.push(`❌ ORDER CAP BREACH: Notional $${order.notional.toLocaleString()} exceeds single order limit $${this.maxNotionalPerOrder.toLocaleString()}`);
    }

    // 3. Daily Drawdown Stop
    if (dailyPnL < this.maxDailyLossThreshold) {
      errors.push(`❌ DAILY DRAWDOWN BREACH: Daily loss -$${Math.abs(dailyPnL).toLocaleString()} exceeds loss ceiling -$${Math.abs(this.maxDailyLossThreshold).toLocaleString()}`);
    }

    // 4. Maximum Live Leverage Cap
    if (order.leverage > this.maxLeverageAllowed) {
      errors.push(`❌ LEVERAGE CAP: Requested leverage ${order.leverage}x exceeds live risk limit of ${this.maxLeverageAllowed}x.`);
    }

    // 5. Margin Sufficiency
    if (order.margin > currentEquity) {
      errors.push(`❌ MARGIN DEFICIT: Required margin $${order.margin.toLocaleString()} exceeds available equity $${currentEquity.toLocaleString()}.`);
    }

    // 6. Volatility Kill Threshold
    if (positionVol > this.volatilityKillThreshold) {
      errors.push(`❌ VOLATILITY CAP: Realized asset volatility ${(positionVol * 100).toFixed(1)}% exceeds safety threshold ${(this.volatilityKillThreshold * 100).toFixed(1)}%.`);
    }

    const approved = errors.length === 0;

    if (!approved) {
      this.auditLog.push({
        timestamp: new Date().toISOString(),
        event: "ORDER_REJECTED_BY_GUARDRAILS",
        orderId: order.id,
        errors,
      });
    }

    return { approved, errors };
  }

  pauseNewOrders(reason = "Manual operator kill switch") {
    this.paused = true;
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      event: "KILL_SWITCH_ENGAGED",
      reason,
    });
    console.warn("🛑 LIVE ORDER EXECUTION PAUSED BY RISK GUARDRAIL:", reason);
  }

  resumeOrders() {
    this.paused = false;
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      event: "KILL_SWITCH_DISENGAGED",
    });
    console.log("✅ LIVE ORDER EXECUTION RESUMED");
  }

  getStatus() {
    return {
      paused: this.paused,
      maxNotionalPerOrder: this.maxNotionalPerOrder,
      maxDailyLossThreshold: this.maxDailyLossThreshold,
      maxLeverageAllowed: this.maxLeverageAllowed,
      auditLogLength: this.auditLog.length,
    };
  }
}

// Global Singleton Guardrail Instance
export const liveGuardrails = new LiveExecutionGuardrails();
