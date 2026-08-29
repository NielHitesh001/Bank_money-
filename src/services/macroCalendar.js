/**
 * Global Macro Economic Calendar & Central Bank Release Schedule
 */

export const MACRO_ECONOMIC_CALENDAR = [
  {
    id: "EVENT-001",
    timeIso: new Date(Date.now() + 1800000).toISOString(), // in 30 mins
    displayTime: "14:00 UTC",
    country: "US",
    currency: "USD",
    event: "FOMC Rate Decision & Monetary Policy Statement",
    impact: "CRITICAL",
    forecast: "5.25%",
    previous: "5.50%",
    consensus: "25 bps Cut",
    category: "Central Bank",
  },
  {
    id: "EVENT-002",
    timeIso: new Date(Date.now() + 7200000).toISOString(), // in 2 hours
    displayTime: "15:30 UTC",
    country: "US",
    currency: "USD",
    event: "Fed Chair Press Conference & Economic Projections",
    impact: "CRITICAL",
    forecast: "—",
    previous: "—",
    consensus: "Neutral Balance Sheet Guidance",
    category: "Speech / Policy",
  },
  {
    id: "EVENT-003",
    timeIso: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    displayTime: "12:15 UTC",
    country: "EU",
    currency: "EUR",
    event: "ECB Main Refinancing Rate Decision",
    impact: "HIGH",
    forecast: "3.65%",
    previous: "3.75%",
    consensus: "10 bps Cut",
    category: "Central Bank",
  },
  {
    id: "EVENT-004",
    timeIso: new Date(Date.now() + 172800000).toISOString(),
    displayTime: "03:00 UTC",
    country: "JP",
    currency: "JPY",
    event: "Bank of Japan Policy Rate & Yield Curve Framework",
    impact: "HIGH",
    forecast: "0.25%",
    previous: "0.25%",
    consensus: "Hold Rate / Signal Fall Hike",
    category: "Central Bank",
  },
  {
    id: "EVENT-005",
    timeIso: new Date(Date.now() + 259200000).toISOString(),
    displayTime: "12:30 UTC",
    country: "US",
    currency: "USD",
    event: "US Core CPI YoY Inflation Gauge",
    impact: "CRITICAL",
    forecast: "2.8%",
    previous: "2.9%",
    consensus: "Disinflation Trend Continuing",
    category: "Inflation",
  },
];

export function getUpcomingMacroEvents(hoursAhead = 72) {
  const now = Date.now();
  const cutoff = now + hoursAhead * 3600000;
  return MACRO_ECONOMIC_CALENDAR.filter((item) => {
    const t = new Date(item.timeIso).getTime();
    return t >= now - 3600000 && t <= cutoff;
  });
}
