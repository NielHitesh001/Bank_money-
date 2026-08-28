import React, { useMemo, useState } from "react";

export const CORPORATE_TREASURY_DATA = [
  {
    ticker: "BRK.B",
    name: "Berkshire Hathaway",
    country: "US",
    flag: "🇺🇸",
    sector: "Conglomerate & Insurance",
    cashReserved: 276.9, // in $B
    marketCap: 980.5,
    debt: 122.5,
    freeCashFlow: 49.8,
    liquidityRating: "Fortress",
    reserveStrategy: "Ultra-liquid Short-term US T-Bills buffer for opportunistic elephant acquisitions.",
    allocation: [
      { label: "US Treasury Bills (0-3M)", pct: 85, color: "#38bdf8" },
      { label: "Bank Cash & Deposits", pct: 10, color: "#64dcb1" },
      { label: "Commercial Paper", pct: 5, color: "#f59e0b" },
    ],
  },
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    country: "US",
    flag: "🇺🇸",
    sector: "Technology & Hardware",
    cashReserved: 162.1,
    marketCap: 3450.0,
    debt: 104.6,
    freeCashFlow: 108.8,
    liquidityRating: "Fortress",
    reserveStrategy: "Tax-optimized multinational cash ladder in US Treasuries and prime corporate paper.",
    allocation: [
      { label: "US Treasuries & Agencies", pct: 62, color: "#38bdf8" },
      { label: "Corporate Bonds & Paper", pct: 23, color: "#818cf8" },
      { label: "Cash & Money Markets", pct: 15, color: "#64dcb1" },
    ],
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corp.",
    country: "US",
    flag: "🇺🇸",
    sector: "Enterprise Software & Cloud",
    cashReserved: 143.9,
    marketCap: 3120.0,
    debt: 77.2,
    freeCashFlow: 74.1,
    liquidityRating: "Fortress",
    reserveStrategy: "AAA-rated balance sheet liquidity backing AI capex infrastructure and cloud scale.",
    allocation: [
      { label: "US Government Securities", pct: 58, color: "#38bdf8" },
      { label: "Mortgage/Corporate Bonds", pct: 27, color: "#a855f7" },
      { label: "Cash & Foreign Deposits", pct: 15, color: "#64dcb1" },
    ],
  },
  {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    country: "US",
    flag: "🇺🇸",
    sector: "Digital Platforms & AI",
    cashReserved: 110.9,
    marketCap: 2050.0,
    debt: 28.4,
    freeCashFlow: 69.5,
    liquidityRating: "Fortress",
    reserveStrategy: "High-yield sovereign liquidity pool with conservative duration.",
    allocation: [
      { label: "US Treasuries", pct: 68, color: "#38bdf8" },
      { label: "Corporate Notes", pct: 20, color: "#f59e0b" },
      { label: "Cash Equivalents", pct: 12, color: "#64dcb1" },
    ],
  },
  {
    ticker: "AMZN",
    name: "Amazon.com Inc.",
    country: "US",
    flag: "🇺🇸",
    sector: "E-Commerce & AWS Cloud",
    cashReserved: 86.8,
    marketCap: 1880.0,
    debt: 132.8,
    freeCashFlow: 36.8,
    liquidityRating: "Strong",
    reserveStrategy: "Working capital liquidity ladder supporting retail fulfillment and AWS data centers.",
    allocation: [
      { label: "US Treasuries", pct: 52, color: "#38bdf8" },
      { label: "Money Market Funds", pct: 30, color: "#64dcb1" },
      { label: "Short-term Paper", pct: 18, color: "#f43f5e" },
    ],
  },
  {
    ticker: "2222.SR",
    name: "Saudi Aramco",
    country: "SA",
    flag: "🇸🇦",
    sector: "Energy & Sovereign Hydrocarbons",
    cashReserved: 64.8,
    marketCap: 1820.0,
    debt: 58.1,
    freeCashFlow: 101.2,
    liquidityRating: "Sovereign-grade",
    reserveStrategy: "Petrodollar cash reserve pegged to US Dollar clearing rails and SAMA banks.",
    allocation: [
      { label: "USD Sovereign Debt", pct: 55, color: "#38bdf8" },
      { label: "SAR Bank Term Deposits", pct: 30, color: "#64dcb1" },
      { label: "Short-term Liquid Funds", pct: 15, color: "#eab308" },
    ],
  },
  {
    ticker: "RELIANCE",
    name: "Reliance Industries & Jio",
    country: "IN",
    flag: "🇮🇳",
    sector: "Digital Telecom, Retail & Energy",
    cashReserved: 32.5,
    marketCap: 240.0,
    debt: 42.1,
    freeCashFlow: 14.2,
    liquidityRating: "Strong",
    reserveStrategy: "Strategic liquidity backing 5G, Jio Financial Services, and green energy investments.",
    allocation: [
      { label: "Government of India G-Secs", pct: 45, color: "#38bdf8" },
      { label: "Indian Tier 1 Bank Deposits", pct: 35, color: "#64dcb1" },
      { label: "Liquid Treasury Cash", pct: 20, color: "#ec4899" },
    ],
  },
  {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    country: "US",
    flag: "🇺🇸",
    sector: "Semiconductors & AI Compute",
    cashReserved: 31.4,
    marketCap: 3100.0,
    debt: 9.7,
    freeCashFlow: 39.2,
    liquidityRating: "Fortress",
    reserveStrategy: "Hyper-growth cash stockpile funding chip fabrication supply chain prepayments.",
    allocation: [
      { label: "US Treasuries", pct: 60, color: "#38bdf8" },
      { label: "Money Market Funds", pct: 25, color: "#64dcb1" },
      { label: "Bank Deposits", pct: 15, color: "#a855f7" },
    ],
  },
  {
    ticker: "TSLA",
    name: "Tesla Inc.",
    country: "US",
    flag: "🇺🇸",
    sector: "Automotive & Clean Energy",
    cashReserved: 30.7,
    marketCap: 680.0,
    debt: 5.2,
    freeCashFlow: 4.4,
    liquidityRating: "Fortress",
    reserveStrategy: "Gigafactory expansion and autonomous robotaxi compute cluster reserve.",
    allocation: [
      { label: "US T-Bills", pct: 72, color: "#38bdf8" },
      { label: "Money Market Funds", pct: 20, color: "#64dcb1" },
      { label: "Cash & Crypto Asset Buffer", pct: 8, color: "#f59e0b" },
    ],
  },
  {
    ticker: "BLK",
    name: "BlackRock, Inc.",
    country: "US",
    flag: "🇺🇸",
    sector: "Global Asset Management",
    cashReserved: 11.2,
    marketCap: 135.0,
    debt: 8.9,
    freeCashFlow: 4.1,
    liquidityRating: "Fortress",
    reserveStrategy: "Operational liquidity and strategic seed capital for APAC expansion & Aladdin infrastructure.",
    allocation: [
      { label: "Overnight Repo & T-Bills", pct: 70, color: "#38bdf8" },
      { label: "Operational Bank Cash", pct: 30, color: "#64dcb1" },
    ],
  },
];

// Helper to render interactive SVG Donut Pie chart
function DonutChart({ slices, size = 130 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const radius = size / 2;
  const innerRadius = radius * 0.58;
  const cx = radius;
  const cy = radius;

  // Compute angles
  let cumulativeAngle = 0;
  const paths = slices.map((slice, i) => {
    const angle = (slice.pct / 100) * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const x1 = cx + radius * Math.sin(startAngle);
    const y1 = cy - radius * Math.cos(startAngle);
    const x2 = cx + radius * Math.sin(endAngle);
    const y2 = cy - radius * Math.cos(endAngle);

    const ix1 = cx + innerRadius * Math.sin(endAngle);
    const iy1 = cy - innerRadius * Math.cos(endAngle);
    const ix2 = cx + innerRadius * Math.sin(startAngle);
    const iy2 = cy - innerRadius * Math.cos(startAngle);

    const largeArc = slice.pct > 50 ? 1 : 0;

    const d = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      L ${ix1} ${iy1}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}
      Z
    `;

    return { ...slice, d, index: i };
  });

  const activeSlice = hoveredIndex !== null ? paths[hoveredIndex] : null;

  return (
    <div className="donut-chart-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill={p.color}
            opacity={hoveredIndex === null || hoveredIndex === i ? 0.95 : 0.4}
            stroke="#070a0b"
            strokeWidth={1.5}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: "pointer", transition: "all 0.15s ease" }}
          />
        ))}
        {/* Center label */}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill="#f0fdf4"
          fontSize="11"
          fontWeight="700"
          fontFamily="DM Mono"
        >
          {activeSlice ? `${activeSlice.pct}%` : "100%"}
        </text>
        <text
          x={cx}
          y={cy + 11}
          textAnchor="middle"
          fill="#647771"
          fontSize="7"
          fontFamily="DM Mono"
        >
          {activeSlice ? "ALLOCATION" : "TREASURY"}
        </text>
      </svg>
    </div>
  );
}

export default function CorporateTreasuryIntelligence() {
  const [search, setSearch] = useState("");
  const [selectedTicker, setSelectedTicker] = useState("BRK.B");

  const filteredCompanies = useMemo(() => {
    if (!search) return CORPORATE_TREASURY_DATA;
    const q = search.toLowerCase();
    return CORPORATE_TREASURY_DATA.filter(
      (c) =>
        c.ticker.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q)
    );
  }, [search]);

  const selected = useMemo(() => {
    return (
      CORPORATE_TREASURY_DATA.find((c) => c.ticker === selectedTicker) ||
      CORPORATE_TREASURY_DATA[0]
    );
  }, [selectedTicker]);

  return (
    <section className="corporate-treasury-card">
      <div className="treasury-card-head">
        <div>
          <span className="eyebrow">CORPORATE BALANCE SHEETS & LIQUIDITY</span>
          <h3>Company Cash Reserves & Market Status</h3>
        </div>
        <span className="treasury-badge">
          {CORPORATE_TREASURY_DATA.length} Global Giants Tracked
        </span>
      </div>

      {/* Quick Search & Select */}
      <div className="treasury-search-strip">
        <input
          type="text"
          placeholder="Search Apple, Berkshire, Reliance, Nvidia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="treasury-ticker-pills">
          {filteredCompanies.slice(0, 6).map((c) => (
            <button
              key={c.ticker}
              className={`ticker-pill ${selected.ticker === c.ticker ? "active" : ""}`}
              onClick={() => setSelectedTicker(c.ticker)}
            >
              {c.flag} {c.ticker}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Company Focus Banner */}
      <div className="treasury-company-profile">
        <div className="profile-left">
          <div className="profile-title-row">
            <span className="company-flag">{selected.flag}</span>
            <div>
              <h4>{selected.name}</h4>
              <span className="company-meta">{selected.ticker} · {selected.sector}</span>
            </div>
            <span className="rating-pill">
              ● {selected.liquidityRating}
            </span>
          </div>

          <div className="treasury-kpi-grid">
            <div className="kpi-block highlight">
              <span>MONEY RESERVED / CASH PILE</span>
              <strong>${selected.cashReserved} Billion</strong>
            </div>
            <div className="kpi-block">
              <span>MARKET CAP</span>
              <strong>${selected.marketCap >= 1000 ? `${(selected.marketCap / 1000).toFixed(2)}T` : `${selected.marketCap}B`}</strong>
            </div>
            <div className="kpi-block">
              <span>TOTAL DEBT</span>
              <strong>${selected.debt}B</strong>
            </div>
            <div className="kpi-block">
              <span>ANNUAL FCF</span>
              <strong style={{ color: "#64dcb1" }}>${selected.freeCashFlow}B</strong>
            </div>
          </div>

          <p className="treasury-strategy-text">
            <b>Treasury Strategy:</b> {selected.reserveStrategy}
          </p>
        </div>

        {/* Donut Chart & Breakdown */}
        <div className="profile-right">
          <DonutChart slices={selected.allocation} size={110} />
          <div className="allocation-legend">
            {selected.allocation.map((item, i) => (
              <div key={i} className="alloc-row">
                <span className="alloc-dot" style={{ background: item.color }} />
                <span className="alloc-label">{item.label}</span>
                <strong className="alloc-pct">{item.pct}%</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
