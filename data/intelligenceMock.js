export const entities = [
  { id: "US-FED", name: "Federal Reserve System", kind: "Central Bank", country: "US", lei: "5493001KJTIIGC8Y1R12", bic: "FRNYUS33", risk: 12, volume: "$18.4B", x: 0, y: -0.6 },
  { id: "JPM-US", name: "JPMorgan Chase Bank, N.A.", kind: "Tier 1 Bank", country: "US", lei: "8ZL2J7A0V6WTJBLD7E73", bic: "CHASUS33", risk: 24, volume: "$6.8B", x: -0.75, y: 0.2 },
  { id: "DB-DE", name: "Deutsche Bank AG", kind: "Tier 1 Bank", country: "DE", lei: "7LTWFZYICNSX8D621K86", bic: "DEUTDEFF", risk: 61, volume: "$4.1B", x: 0.82, y: 0.25 },
  { id: "NORD-EE", name: "NordEast Commerce OÜ", kind: "Regional Institution", country: "EE", lei: "549300TESTNORD8EAST7", bic: "NECOEE2X", risk: 84, volume: "$912M", x: 0.2, y: 0.92 },
  { id: "HARBOR-AE", name: "Harbor Trading FZE", kind: "Corporate Endpoint", country: "AE", account: "AE•••• 5421", risk: 92, volume: "$1.4B", x: 1.25, y: -0.68 },
  { id: "ORION-KY", name: "Orion Holdings Ltd.", kind: "Corporate Endpoint", country: "KY", account: "KY•••• 0219", risk: 96, volume: "$1.1B", x: -0.92, y: -0.92 },
  { id: "EAST-GB", name: "Eastbridge Bank plc", kind: "Regional Institution", country: "GB", lei: "213800EASTBRIDGE88", bic: "EASBGB2L", risk: 47, volume: "$2.7B", x: -1.48, y: -0.2 },
  { id: "CB-UAE", name: "Central Bank of the UAE", kind: "Central Bank", country: "AE", lei: "549300CBUAE00000001", bic: "CBUAUAEX", risk: 18, volume: "$10.8B", x: 1.66, y: -0.15 },
];

export const transactions = [
  { id: "TX-2026-08491", source: "US-FED", target: "JPM-US", amount: 184000000, display: "$184.0M", currency: "USD", rail: "Fedwire", date: "2026-08-29 09:14 UTC", risk: 14, flag: null },
  { id: "TX-2026-08492", source: "JPM-US", target: "DB-DE", amount: 12800000, display: "$12.8M", currency: "USD", rail: "SWIFT", date: "2026-08-29 09:21 UTC", risk: 41, flag: null },
  { id: "TX-2026-08493", source: "DB-DE", target: "NORD-EE", amount: 12680000, display: "$12.68M", currency: "EUR", rail: "SWIFT", date: "2026-08-29 09:24 UTC", risk: 79, flag: "Rapid pass-through" },
  { id: "TX-2026-08494", source: "NORD-EE", target: "HARBOR-AE", amount: 12400000, display: "$12.40M", currency: "USD", rail: "SWIFT", date: "2026-08-29 09:28 UTC", risk: 94, flag: "Sanctions proximity" },
  { id: "TX-2026-08495", source: "JPM-US", target: "ORION-KY", amount: 9700000, display: "$9.70M", currency: "USD", rail: "SWIFT", date: "2026-08-29 09:31 UTC", risk: 88, flag: "PEP-associated beneficiary" },
  { id: "TX-2026-08496", source: "EAST-GB", target: "JPM-US", amount: 4100000, display: "$4.10M", currency: "GBP", rail: "CHAPS", date: "2026-08-29 09:36 UTC", risk: 33, flag: null },
  { id: "TX-2026-08497", source: "CB-UAE", target: "HARBOR-AE", amount: 32200000, display: "$32.20M", currency: "AED", rail: "RTGS", date: "2026-08-29 09:41 UTC", risk: 54, flag: null },
];

export const cases = [
  { id: "CASE-1842", title: "Baltic routing anomaly", severity: "Critical", transactions: 4, updated: "2 min ago" },
  { id: "CASE-1837", title: "Orion Holdings exposure", severity: "High", transactions: 2, updated: "18 min ago" },
  { id: "CASE-1829", title: "Unusual USD corridor", severity: "Medium", transactions: 7, updated: "42 min ago" },
];
