import { NextResponse } from "next/server";

const FRED_KEY = process.env.FRED_API_KEY ?? "DEMO_KEY";
const BASE = "https://api.stlouisfed.org/fred/series/observations";
const WB   = "https://api.worldbank.org/v2/country/US;CN;JP;DE;GB/indicator/NY.GDP.MKTP.CD?format=json&date=2020:2023";

type Obs   = { date: string; value: string };
type Serie = { id: string; label: string; unit: string };

const SERIES: Serie[] = [
  { id: "M2SL",            label: "m2",       unit: "B" },
  { id: "FEDFUNDS",        label: "fedfunds",  unit: "%" },
  { id: "CPIAUCSL",        label: "cpi",       unit: "idx" },
  { id: "DGS10",           label: "t10y",      unit: "%" },
  { id: "WALCL",           label: "balansh",   unit: "M" },
  { id: "TOTALSL",         label: "credit",    unit: "M" },
  { id: "DPSACBW027SBOG",  label: "deposits",  unit: "B" },
];

// ─── FALLBACK ─────────────────────────────────────────────────────────────────
function makeFallback() {
  const months = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(2023, 0 + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });

  const seed = (base: number, drift: number, noise: number) =>
    months.map((date, i) => ({
      date,
      value: +(base + drift * i + (Math.sin(i * 0.7) * noise)).toFixed(3),
    }));

  return {
    m2:       seed(20500, 28,  120),
    fedfunds: seed(0.08,  0.22, 0.08),
    cpi:      seed(281,   1.1,  0.4),
    t10y:     seed(1.52,  0.14, 0.18),
    balansh:  seed(8500000, -18000, 40000),
    credit:   seed(4200000,  9000,  8000),
    deposits: seed(10200,   -15,    80),
    gdp: [
      { country: "US", gdp: 25.46e12 },
      { country: "CN", gdp: 17.73e12 },
      { country: "JP", gdp:  4.23e12 },
      { country: "DE", gdp:  4.07e12 },
      { country: "GB", gdp:  3.07e12 },
    ],
    source: "fallback" as const,
  };
}

// ─── FRED FETCH ───────────────────────────────────────────────────────────────
async function fetchFred(series: Serie): Promise<{ label: string; data: { date: string; value: number }[] }> {
  const url = `${BASE}?series_id=${series.id}&api_key=${FRED_KEY}&file_type=json&limit=24&sort_order=desc`;
  const r = await fetch(url, { next: { revalidate: 3600 } });
  if (!r.ok) throw new Error(`FRED ${series.id} ${r.status}`);
  const j = await r.json();
  const data = ((j.observations ?? []) as Obs[])
    .filter(o => o.value !== ".")
    .map(o => ({ date: o.date, value: parseFloat(o.value) }))
    .reverse();
  return { label: series.label, data };
}

// ─── WORLD BANK FETCH ─────────────────────────────────────────────────────────
async function fetchGDP(): Promise<{ country: string; gdp: number }[]> {
  const r = await fetch(WB, { next: { revalidate: 86400 } });
  if (!r.ok) throw new Error(`WB ${r.status}`);
  const [, rows] = await r.json();
  const best: Record<string, { gdp: number; date: string }> = {};
  for (const row of rows ?? []) {
    if (!row.value) continue;
    const c = row.countryiso3code || row.country?.id;
    if (!best[c] || row.date > best[c].date) best[c] = { gdp: row.value, date: row.date };
  }
  return Object.entries(best)
    .map(([country, v]) => ({ country, gdp: v.gdp }))
    .sort((a, b) => b.gdp - a.gdp);
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const [seriesResults, gdpResult] = await Promise.allSettled([
      Promise.all(SERIES.map(fetchFred)),
      fetchGDP(),
    ]);

    if (seriesResults.status === "rejected") {
      return NextResponse.json({ ...makeFallback() });
    }

    const payload: Record<string, unknown> = { source: "live" };
    for (const s of seriesResults.value) payload[s.label] = s.data;
    payload.gdp = gdpResult.status === "fulfilled" ? gdpResult.value : makeFallback().gdp;

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ ...makeFallback() });
  }
}
