/**
 * Large Institutional Entity Dataset Generator (250+ Entities)
 * Generates G-SIBs, Central Banks, Regional Banks, Sovereign Wealth Funds,
 * Asset Managers, and Clearing Houses with LEI, SWIFT/BIC, and Risk Profiles.
 */

import fs from "node:fs";
import path from "node:path";

const ENTITY_CATEGORIES = [
  { type: "CENTRAL_BANK", count: 20, prefix: "CB", riskRange: [1, 10] },
  { type: "GSIB_TIER1", count: 40, prefix: "GSIB", riskRange: [5, 25] },
  { type: "REGIONAL_BANK", count: 80, prefix: "REG", riskRange: [15, 60] },
  { type: "SOVEREIGN_WEALTH", count: 25, prefix: "SWF", riskRange: [5, 20] },
  { type: "ASSET_MANAGER", count: 45, prefix: "AM", riskRange: [10, 45] },
  { type: "HEDGE_FUND", count: 30, prefix: "HF", riskRange: [25, 75] },
  { type: "CLEARING_HOUSE", count: 15, prefix: "CCP", riskRange: [1, 12] },
];

const COUNTRIES = [
  { code: "US", name: "United States", currency: "USD", region: "North America" },
  { code: "GB", name: "United Kingdom", currency: "GBP", region: "Europe" },
  { code: "DE", name: "Germany", currency: "EUR", region: "Europe" },
  { code: "FR", name: "France", currency: "EUR", region: "Europe" },
  { code: "CH", name: "Switzerland", currency: "CHF", region: "Europe" },
  { code: "JP", name: "Japan", currency: "JPY", region: "Asia-Pacific" },
  { code: "SG", name: "Singapore", currency: "SGD", region: "Asia-Pacific" },
  { code: "HK", name: "Hong Kong", currency: "HKD", region: "Asia-Pacific" },
  { code: "IN", name: "India", currency: "INR", region: "Asia-Pacific" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", region: "Middle East" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", region: "Middle East" },
  { code: "BR", name: "Brazil", currency: "BRL", region: "Latin America" },
  { code: "AU", name: "Australia", currency: "AUD", region: "Asia-Pacific" },
  { code: "CA", name: "Canada", currency: "CAD", region: "North America" },
  { code: "KY", name: "Cayman Islands", currency: "USD", region: "Offshore" },
  { code: "VG", name: "British Virgin Islands", currency: "USD", region: "Offshore" },
  { code: "PA", name: "Panama", currency: "USD", region: "Offshore" },
];

const RATINGS = ["AAA", "AA+", "AA", "AA-", "A+", "A", "A-", "BBB+", "BBB", "BBB-", "BB+", "BB", "B", "CCC"];

function generateLei(index) {
  const prefix = "549300";
  const body = String(index).padStart(12, "0");
  const checksum = String((index * 13 + 17) % 89 + 10);
  return `${prefix}${body}${checksum}`;
}

function generateSwift(name, countryCode) {
  const cleanName = name.replace(/[^A-Z]/gi, "").toUpperCase().slice(0, 4).padEnd(4, "X");
  return `${cleanName}${countryCode}2X`;
}

export function generateEntityDataset() {
  const entities = [];
  let globalIndex = 1;

  // 1. Specific High-Profile Anchor Entities
  const anchorEntities = [
    { id: "CB-FED-US", name: "Federal Reserve System", type: "CENTRAL_BANK", country: "US", rating: "AAA", tier: 1, baseRisk: 2 },
    { id: "CB-ECB-EU", name: "European Central Bank", type: "CENTRAL_BANK", country: "DE", rating: "AAA", tier: 1, baseRisk: 2 },
    { id: "CB-BOE-UK", name: "Bank of England", type: "CENTRAL_BANK", country: "GB", rating: "AAA", tier: 1, baseRisk: 2 },
    { id: "CB-BOJ-JP", name: "Bank of Japan", type: "CENTRAL_BANK", country: "JP", rating: "AAA", tier: 1, baseRisk: 3 },
    { id: "CB-RBI-IN", name: "Reserve Bank of India", type: "CENTRAL_BANK", country: "IN", rating: "BBB-", tier: 1, baseRisk: 8 },
    { id: "GSIB-JPM-US", name: "JPMorgan Chase & Co", type: "GSIB_TIER1", country: "US", rating: "AA-", tier: 1, baseRisk: 12 },
    { id: "GSIB-BAC-US", name: "Bank of America Corp", type: "GSIB_TIER1", country: "US", rating: "A+", tier: 1, baseRisk: 14 },
    { id: "GSIB-HSBC-UK", name: "HSBC Holdings plc", type: "GSIB_TIER1", country: "GB", rating: "A+", tier: 1, baseRisk: 18 },
    { id: "GSIB-BNP-FR", name: "BNP Paribas SA", type: "GSIB_TIER1", country: "FR", rating: "A+", tier: 1, baseRisk: 15 },
    { id: "GSIB-DB-DE", name: "Deutsche Bank AG", type: "GSIB_TIER1", country: "DE", rating: "A-", tier: 1, baseRisk: 22 },
    { id: "GSIB-UBS-CH", name: "UBS Group AG", type: "GSIB_TIER1", country: "CH", rating: "A+", tier: 1, baseRisk: 16 },
    { id: "AM-BLK-US", name: "BlackRock Inc", type: "ASSET_MANAGER", country: "US", rating: "AA-", tier: 1, baseRisk: 10 },
    { id: "AM-VAN-US", name: "Vanguard Group", type: "ASSET_MANAGER", country: "US", rating: "AAA", tier: 1, baseRisk: 8 },
    { id: "SWF-CIC-CN", name: "China Investment Corporation", type: "SOVEREIGN_WEALTH", country: "SG", rating: "A+", tier: 1, baseRisk: 15 },
    { id: "SWF-PIF-SA", name: "Public Investment Fund", type: "SOVEREIGN_WEALTH", country: "SA", rating: "A+", tier: 1, baseRisk: 14 },
    { id: "SWF-ADIA-AE", name: "Abu Dhabi Investment Authority", type: "SOVEREIGN_WEALTH", country: "AE", rating: "AA", tier: 1, baseRisk: 9 },
    { id: "CCP-DTCC-US", name: "Depository Trust & Clearing Corp", type: "CLEARING_HOUSE", country: "US", rating: "AAA", tier: 1, baseRisk: 1 },
    { id: "CCP-CLS-US", name: "CLS Bank International", type: "CLEARING_HOUSE", country: "US", rating: "AAA", tier: 1, baseRisk: 1 },
    { id: "CCP-LCH-UK", name: "LCH Clearnet Group", type: "CLEARING_HOUSE", country: "GB", rating: "AAA", tier: 1, baseRisk: 2 },
  ];

  anchorEntities.forEach((anchor) => {
    const c = COUNTRIES.find((x) => x.code === anchor.country) || COUNTRIES[0];
    entities.push({
      id: anchor.id,
      name: anchor.name,
      type: anchor.type,
      category: anchor.type.replace(/_/g, " "),
      countryCode: c.code,
      countryName: c.name,
      currency: c.currency,
      region: c.region,
      lei: generateLei(globalIndex),
      swiftBic: generateSwift(anchor.name, c.code),
      rating: anchor.rating,
      tier1Ratio: 14.5 + (globalIndex % 6),
      riskScore: anchor.baseRisk,
      ofacFlag: false,
      pepFlag: false,
      status: "ACTIVE",
      totalAssetsUsd: 1500000000000 / (globalIndex > 5 ? 2 : 1),
    });
    globalIndex++;
  });

  // 2. Synthesize Rest of the 255 Entities
  ENTITY_CATEGORIES.forEach((cat) => {
    const needed = cat.count;
    for (let i = 1; i <= needed; i++) {
      const country = COUNTRIES[globalIndex % COUNTRIES.length];
      const isOffshore = country.region === "Offshore";
      const isSanctionRisk = isOffshore && (globalIndex % 7 === 0);
      const risk = Math.min(99, Math.max(1, Math.round(cat.riskRange[0] + (Math.random() * (cat.riskRange[1] - cat.riskRange[0])) + (isSanctionRisk ? 40 : 0))));
      const rating = RATINGS[Math.min(RATINGS.length - 1, Math.floor((risk / 100) * RATINGS.length))];
      const entityId = `${cat.prefix}-${country.code}-${String(globalIndex).padStart(4, "0")}`;
      const name = `${country.name} ${cat.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} ${i}`;

      entities.push({
        id: entityId,
        name,
        type: cat.type,
        category: cat.type.replace(/_/g, " "),
        countryCode: country.code,
        countryName: country.name,
        currency: country.currency,
        region: country.region,
        lei: generateLei(globalIndex),
        swiftBic: generateSwift(name, country.code),
        rating,
        tier1Ratio: parseFloat((10.0 + (Math.random() * 8.0)).toFixed(2)),
        riskScore: risk,
        ofacFlag: isSanctionRisk,
        pepFlag: isOffshore && (globalIndex % 5 === 0),
        status: isSanctionRisk ? "SANCTION_FLAGGED" : "ACTIVE",
        totalAssetsUsd: Math.round(1000000000 * (1 + Math.random() * 500)),
      });
      globalIndex++;
    }
  });

  return entities;
}

if (process.argv[1] && process.argv[1].endsWith("generate-entities-large.mjs")) {
  const dataset = generateEntityDataset();
  const outPath = path.resolve("./data/entities_large.json");
  fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2));
  console.log(`✅ Generated ${dataset.length} institutional entities at ${outPath}`);
}
