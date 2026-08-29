/**
 * Real-Time Risk Alert & Breach Notification Engine
 * Monitors margin utilization, VaR exposure, and drawdown limits.
 */

export class RiskAlertEngine {
  constructor() {
    this.alerts = [];
    this.subscribers = new Set();
  }

  evaluatePortfolioRisk(metrics = {}) {
    const {
      marginUtilizationPct = 0,
      var95_1d = 0,
      varLimitUsd = 100000,
      dailyPnL = 0,
      dailyLossLimit = -50000,
    } = metrics;

    const detectedAlerts = [];

    // 1. Margin Utilization Alert
    if (marginUtilizationPct >= 90) {
      detectedAlerts.push({
        id: `ALT-MAR-${Date.now()}`,
        severity: "CRITICAL",
        title: "CRITICAL MARGIN BREACH",
        message: `Margin utilization reached ${marginUtilizationPct}% (Threshold: 90%). Immediate liquidation risk.`,
        action: "DEPOSIT_COLLATERAL_OR_UNWIND",
        timestamp: new Date().toISOString(),
      });
    } else if (marginUtilizationPct >= 75) {
      detectedAlerts.push({
        id: `ALT-MAR-W-${Date.now()}`,
        severity: "HIGH",
        title: "ELEVATED MARGIN USAGE",
        message: `Margin utilization at ${marginUtilizationPct}% exceeds warning threshold (75%).`,
        action: "MONITOR_LEVERAGE",
        timestamp: new Date().toISOString(),
      });
    }

    // 2. VaR Limit Breach
    if (var95_1d > varLimitUsd) {
      detectedAlerts.push({
        id: `ALT-VAR-${Date.now()}`,
        severity: "HIGH",
        title: "PORTFOLIO VaR LIMIT EXCEEDED",
        message: `1-Day 95% VaR ($${var95_1d.toLocaleString()}) exceeds mandated risk ceiling ($${varLimitUsd.toLocaleString()}).`,
        action: "REDUCE_CROSS_ASSET_EXPOSURE",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Daily Loss Drawdown Trigger
    if (dailyPnL < dailyLossLimit) {
      detectedAlerts.push({
        id: `ALT-DD-${Date.now()}`,
        severity: "CRITICAL",
        title: "DAILY DRAWDOWN CIRCUIT BREAKER",
        message: `Intraday loss -$${Math.abs(dailyPnL).toLocaleString()} breached hard stop threshold -$${Math.abs(dailyLossLimit).toLocaleString()}.`,
        action: "HALT_NEW_ORDER_FLOW",
        timestamp: new Date().toISOString(),
      });
    }

    if (detectedAlerts.length > 0) {
      this.alerts = [...detectedAlerts, ...this.alerts].slice(0, 50);
      this.notify(detectedAlerts);
    }

    return detectedAlerts;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(newAlerts) {
    this.subscribers.forEach((cb) => {
      try {
        cb(newAlerts);
      } catch (err) {
        console.error("Risk alert callback error:", err);
      }
    });
  }

  getAlerts() {
    return this.alerts;
  }
}

// Global Singleton
export const riskAlertEngine = new RiskAlertEngine();
