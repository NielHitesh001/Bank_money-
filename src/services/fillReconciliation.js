/**
 * Position & Fill Reconciliation Engine
 * Detects discrepancies between broker-reported positions and internal blotter records.
 */

export class FillReconciliationEngine {
  reconcile(brokerPositions = [], localPositions = []) {
    const discrepancies = [];
    const localMap = new Map(localPositions.map((p) => [p.symbol, p]));
    const brokerMap = new Map(brokerPositions.map((p) => [p.symbol, p]));

    // Check broker positions against local
    brokerPositions.forEach((bPos) => {
      const lPos = localMap.get(bPos.symbol);
      const bUnits = Number(bPos.units || bPos.qty || 0);

      if (!lPos) {
        discrepancies.push({
          type: "UNREGISTERED_BROKER_POSITION",
          severity: "HIGH",
          symbol: bPos.symbol,
          brokerUnits: bUnits,
          localUnits: 0,
          description: `Position for ${bPos.symbol} (${bUnits} units) exists on broker but not in local blotter.`,
        });
      } else if (Number(lPos.units) !== bUnits) {
        discrepancies.push({
          type: "QUANTITY_MISMATCH",
          severity: "MODERATE",
          symbol: bPos.symbol,
          brokerUnits: bUnits,
          localUnits: Number(lPos.units),
          difference: bUnits - Number(lPos.units),
          description: `Unit mismatch on ${bPos.symbol}: Broker=${bUnits}, Local=${lPos.units}`,
        });
      }
    });

    // Check local positions missing on broker
    localPositions.forEach((lPos) => {
      if (!brokerMap.has(lPos.symbol)) {
        discrepancies.push({
          type: "MISSING_ON_BROKER",
          severity: "CRITICAL",
          symbol: lPos.symbol,
          brokerUnits: 0,
          localUnits: Number(lPos.units),
          description: `Local position for ${lPos.symbol} (${lPos.units} units) was not reported by broker.`,
        });
      }
    });

    return {
      status: discrepancies.length === 0 ? "RECONCILED_CLEAN" : "DISCREPANCIES_DETECTED",
      reconciledAt: new Date().toISOString(),
      discrepancyCount: discrepancies.length,
      discrepancies,
    };
  }
}

// Global Singleton
export const reconciliationEngine = new FillReconciliationEngine();
