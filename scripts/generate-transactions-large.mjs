/**
 * Large Multi-Currency Transaction Edge Dataset Generator (1,200+ Edges)
 * Simulates cross-border clearing, correspondent banking, FX settlements (Fedwire, TARGET2, CHAPS, CIPS, RTGS, PIX)
 */

import fs from "node:fs";
import path from "node:path";
import { generateEntityDataset } from "./generate-entities-large.mjs";

const CLEARING_RAILS = [
  { code: "FEDWIRE", currency: "USD", avgAmount: 25000000 },
  { code: "CHIPS", currency: "USD", avgAmount: 15000000 },
  { code: "TARGET2", currency: "EUR", avgAmount: 18000000 },
  { code: "CHAPS", currency: "GBP", avgAmount: 12000000 },
  { code: "CLS", currency: "USD", avgAmount: 50000000 },
  { code: "CIPS", currency: "CNY", avgAmount: 8000000 },
  { code: "RTGS_IN", currency: "INR", avgAmount: 5000000 },
  { code: "PIX", currency: "BRL", avgAmount: 2000000 },
  { code: "SWIFT_FIN", currency: "USD", avgAmount: 10000000 },
];

const ANOMALY_TYPES = ["STRUCTURING", "SANCTION_HOP", "RAPID_MOVEMENT", "SHELL_CONDUIT", "UNUSUAL_VOLUME"];

export function generateTransactionDataset(entities, edgeCount = 1250) {
  const transactions = [];
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  for (let i = 1; i <= edgeCount; i++) {
    const sourceIdx = Math.floor(Math.random() * entities.length);
    let targetIdx = Math.floor(Math.random() * entities.length);
    while (targetIdx === sourceIdx) {
      targetIdx = Math.floor(Math.random() * entities.length);
    }

    const source = entities[sourceIdx];
    const target = entities[targetIdx];
    const rail = CLEARING_RAILS[Math.floor(Math.random() * CLEARING_RAILS.length)];

    const isHighRiskHop = source.riskScore > 50 || target.riskScore > 50;
    const isAnomalous = isHighRiskHop && (i % 8 === 0);
    const anomalyType = isAnomalous ? ANOMALY_TYPES[i % ANOMALY_TYPES.length] : null;

    const baseAmount = rail.avgAmount * (0.1 + Math.random() * 2.5);
    const amount = parseFloat(baseAmount.toFixed(2));
    const timestamp = new Date(now - Math.floor(Math.random() * ninetyDaysMs)).toISOString();

    transactions.push({
      id: `TX-2026-${String(i).padStart(6, "0")}`,
      sourceId: source.id,
      sourceName: source.name,
      sourceCountry: source.countryCode,
      targetId: target.id,
      targetName: target.name,
      targetCountry: target.countryCode,
      amount,
      currency: rail.currency,
      rail: rail.code,
      timestamp,
      settlementStatus: "SETTLED",
      riskScore: Math.round((source.riskScore + target.riskScore) / 2 + (isAnomalous ? 25 : 0)),
      isAnomalous,
      anomalyType,
      uetr: `f81d4fae-7dec-11d0-a765-${String(i).padStart(12, "0")}`,
      swiftMessage: `MT103 / pacs.008.001.08 (Seq #${i})`,
    });
  }

  return transactions;
}

if (process.argv[1] && process.argv[1].endsWith("generate-transactions-large.mjs")) {
  const entities = generateEntityDataset();
  const transactions = generateTransactionDataset(entities, 1250);
  const outPath = path.resolve("./data/transactions_large.json");
  fs.writeFileSync(outPath, JSON.stringify(transactions, null, 2));
  console.log(`✅ Generated ${transactions.length} transaction edges at ${outPath}`);
}
