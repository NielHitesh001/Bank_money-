// Macro Liquidity Data Provider & Live FRED Client

export const MACRO_SERIES_CONFIG = [
  { id: "M2SL", key: "m2", label: "M2 Money Supply", unit: "$B", description: "Broad money stock (currency + checking + savings + money markets)" },
  { id: "FEDFUNDS", key: "fedfunds", label: "Federal Funds Rate", unit: "%", description: "Effective overnight interbank lending policy benchmark" },
  { id: "CPIAUCSL", key: "cpi", label: "Consumer Price Index", unit: "pts", description: "Headline urban consumer price inflation index" },
  { id: "DGS10", key: "t10y", label: "10-Year Treasury Yield", unit: "%", description: "Benchmark risk-free sovereign cost of capital" },
  { id: "WALCL", key: "balansh", label: "Fed Balance Sheet", unit: "$M", description: "Total reserve bank assets & central bank balance sheet expansion" },
  { id: "TOTALSL", key: "credit", label: "Total Consumer Credit", unit: "$M", description: "Outstanding credit market debt across household sector" },
  { id: "DPSACBW027SBOG", key: "deposits", label: "Commercial Bank Deposits", unit: "$B", description: "Total deposit liabilities inside chartered US commercial banks" },
];

export function generateDeterministicFallback() {
  const months = Array.from({ length: 24 }, (_, i) => {
    const year = 2024 + Math.floor(i / 12);
    const month = ((i % 12) + 1).toString().padStart(2, "0");
    return `${year}-${month}-01`;
  });

  const seed = (base, drift, noise) =>
    months.map((date, i) => ({
      date,
      value: +(base + drift * i + (Math.sin(i * 0.75) * noise)).toFixed(2),
    }));

  return {
    source: "demo",
    asOf: new Date().toISOString(),
    series: {
      m2: seed(20850, 32, 95),
      fedfunds: seed(5.25, -0.06, 0.04),
      cpi: seed(312.4, 0.65, 0.3),
      t10y: seed(4.25, -0.03, 0.12),
      balansh: seed(7450000, -22000, 35000),
      credit: seed(5020000, 11500, 9200),
      deposits: seed(17420, 24, 60),
    },
    gdp: [
      { country: "US", name: "United States", gdp: 28.78, share: 26.2 },
      { country: "CN", name: "China", gdp: 18.53, share: 16.9 },
      { country: "DE", name: "Germany", gdp: 4.59, share: 4.2 },
      { country: "JP", name: "Japan", gdp: 4.21, share: 3.8 },
      { country: "IN", name: "India", gdp: 3.94, share: 3.6 },
      { country: "GB", name: "United Kingdom", gdp: 3.50, share: 3.2 },
      { country: "FR", name: "France", gdp: 3.13, share: 2.8 },
    ],
  };
}

export async function fetchFredSeries(seriesId, apiKey) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`FRED HTTP error: ${res.status}`);
  const json = await res.json();
  const obs = (json.observations || [])
    .filter((o) => o.value !== "." && o.value !== "")
    .slice(-24)
    .map((o) => ({ date: o.date, value: Number(o.value) }));
  return obs;
}

export async function fetchMacroLiquidity(endpointUrl) {
  const apiKey = (typeof process !== "undefined" && process.env?.FRED_API_KEY) ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FRED_API_KEY);

  const targetUrl = endpointUrl || (typeof import.meta !== "undefined" && import.meta.env?.VITE_MACRO_API_URL);

  if (targetUrl) {
    try {
      const response = await fetch(targetUrl, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const data = await response.json();
        return {
          source: data.source || "live",
          asOf: data.asOf || new Date().toISOString(),
          series: data.series || generateDeterministicFallback().series,
          gdp: data.gdp || generateDeterministicFallback().gdp,
        };
      }
    } catch {
      // Fall through to direct or demo fallback
    }
  }

  // If live FRED API key is configured, query FRED endpoints
  if (apiKey && apiKey !== "your_fred_api_key_here") {
    try {
      const fallback = generateDeterministicFallback();
      const seriesPromises = MACRO_SERIES_CONFIG.map(async (cfg) => {
        try {
          const points = await fetchFredSeries(cfg.id, apiKey);
          return [cfg.key, points.length > 0 ? points : fallback.series[cfg.key]];
        } catch {
          return [cfg.key, fallback.series[cfg.key]];
        }
      });

      const results = await Promise.all(seriesPromises);
      const liveSeries = Object.fromEntries(results);

      return {
        source: "live-fred",
        asOf: new Date().toISOString(),
        series: liveSeries,
        gdp: fallback.gdp,
      };
    } catch {
      return generateDeterministicFallback();
    }
  }

  return generateDeterministicFallback();
}
