import fs from "node:fs";
import path from "node:path";
import { entities as baseEntities, transactions as baseTransactions, cases as baseCases } from "../../data/intelligenceMock.js";

const ENTITIES_LARGE_PATH = path.resolve("./data/entities_large.json");
const TRANSACTIONS_LARGE_PATH = path.resolve("./data/transactions_large.json");

let cachedEntities = null;
let cachedTransactions = null;

export function getEntities(filters = {}) {
  if (!cachedEntities) {
    if (fs.existsSync(ENTITIES_LARGE_PATH)) {
      try {
        cachedEntities = JSON.parse(fs.readFileSync(ENTITIES_LARGE_PATH, "utf-8"));
      } catch {
        cachedEntities = baseEntities;
      }
    } else {
      cachedEntities = baseEntities;
    }
  }

  let result = cachedEntities;

  if (filters.type) {
    result = result.filter((e) => e.type === filters.type || e.kind === filters.type);
  }
  if (filters.country) {
    result = result.filter((e) => e.countryCode === filters.country || e.country === filters.country);
  }
  if (filters.minRisk) {
    const min = Number(filters.minRisk);
    result = result.filter((e) => (e.riskScore || e.risk || 0) >= min);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || (e.lei && e.lei.toLowerCase().includes(q)));
  }

  return result;
}

export function getTransactions(filters = {}) {
  if (!cachedTransactions) {
    if (fs.existsSync(TRANSACTIONS_LARGE_PATH)) {
      try {
        cachedTransactions = JSON.parse(fs.readFileSync(TRANSACTIONS_LARGE_PATH, "utf-8"));
      } catch {
        cachedTransactions = baseTransactions;
      }
    } else {
      cachedTransactions = baseTransactions;
    }
  }

  let result = cachedTransactions;

  if (filters.rail) {
    result = result.filter((t) => (t.rail || "").toLowerCase() === filters.rail.toLowerCase());
  }
  if (filters.currency) {
    result = result.filter((t) => t.currency === filters.currency);
  }
  if (filters.anomalousOnly === "true" || filters.anomalousOnly === true) {
    result = result.filter((t) => t.isAnomalous || t.flag);
  }
  if (filters.entityId) {
    result = result.filter((t) => t.sourceId === filters.entityId || t.targetId === filters.entityId || t.source === filters.entityId || t.target === filters.entityId);
  }

  return result;
}
