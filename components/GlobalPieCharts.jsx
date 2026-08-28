import React, { useState } from "react";

export const MACRO_DISTRIBUTIONS = {
  fxReserves: {
    title: "Global FX Currency Reserves (IMF COFER)",
    subtitle: "Share of Allocated Global Foreign Exchange Reserves",
    unit: "%",
    slices: [
      { label: "US Dollar (USD)", pct: 58.4, value: "$6.68T", color: "#38bdf8" },
      { label: "Euro (EUR)", pct: 19.9, value: "$2.28T", color: "#64dcb1" },
      { label: "Japanese Yen (JPY)", pct: 5.7, value: "$652B", color: "#f59e0b" },
      { label: "British Pound (GBP)", pct: 4.8, value: "$549B", color: "#a855f7" },
      { label: "Canadian Dollar (CAD)", pct: 2.5, value: "$286B", color: "#ec4899" },
      { label: "Australian Dollar (AUD)", pct: 2.1, value: "$240B", color: "#14b8a6" },
      { label: "Chinese Renminbi (CNY)", pct: 2.1, value: "$240B", color: "#f43f5e" },
      { label: "Other Currencies", pct: 4.5, value: "$515B", color: "#64748b" },
    ],
  },
  paymentRails: {
    title: "Global Payment Rails Daily Volume Share",
    subtitle: "Interbank Gross Settlement & Messaging Distribution",
    unit: "%",
    slices: [
      { label: "Fedwire (Federal Reserve)", pct: 36.2, value: "$4.20T/day", color: "#38bdf8" },
      { label: "SWIFT Interbank MT/MX", pct: 31.8, value: "$3.70T/day", color: "#64dcb1" },
      { label: "TARGET2 (European Central Bank)", pct: 18.5, value: "$2.15T/day", color: "#818cf8" },
      { label: "CHAPS (Bank of England)", pct: 5.4, value: "$630B/day", color: "#f59e0b" },
      { label: "Instant Clearing (UPI/FAST/PromptPay)", pct: 4.5, value: "$520B/day", color: "#ec4899" },
      { label: "Other Regional RTGS", pct: 3.6, value: "$418B/day", color: "#64748b" },
    ],
  },
  swfAssets: {
    title: "Sovereign Wealth Funds (SWF) Asset Allocation",
    subtitle: "$12.4T Global Sovereign Portfolio Breakdown",
    unit: "%",
    slices: [
      { label: "Global Public Equities", pct: 42.0, value: "$5.21T", color: "#38bdf8" },
      { label: "Sovereign Fixed Income & Debt", pct: 31.0, value: "$3.84T", color: "#64dcb1" },
      { label: "Private Equity & Infrastructure", pct: 18.0, value: "$2.23T", color: "#a855f7" },
      { label: "Liquid Cash & Treasury T-Bills", pct: 9.0, value: "$1.12T", color: "#f59e0b" },
    ],
  },
};

function PieDonutCanvas({ slices, isDonut = true, size = 150 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const radius = size / 2;
  const innerRadius = isDonut ? radius * 0.54 : 0;
  const cx = radius;
  const cy = radius;

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

    const largeArc = slice.pct > 50 ? 1 : 0;

    let d = "";
    if (isDonut) {
      const ix1 = cx + innerRadius * Math.sin(endAngle);
      const iy1 = cy - innerRadius * Math.cos(endAngle);
      const ix2 = cx + innerRadius * Math.sin(startAngle);
      const iy2 = cy - innerRadius * Math.cos(startAngle);
      d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    } else {
      d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }

    return { ...slice, d, index: i };
  });

  const activeSlice = hoveredIndex !== null ? paths[hoveredIndex] : null;

  return (
    <div className="pie-canvas-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill={p.color}
            opacity={hoveredIndex === null || hoveredIndex === i ? 0.95 : 0.35}
            stroke="#060908"
            strokeWidth={1.5}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: "pointer", transition: "all 0.15s ease" }}
          />
        ))}
        {isDonut && (
          <>
            <text
              x={cx}
              y={cy - 2}
              textAnchor="middle"
              fill="#f0fdf4"
              fontSize="12"
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
              {activeSlice ? activeSlice.label.split(" ")[0] : "GLOBAL"}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

export default function GlobalPieCharts() {
  const [activeTab, setActiveTab] = useState("fxReserves"); // "fxReserves" | "paymentRails" | "swfAssets"
  const [chartType, setChartType] = useState("donut"); // "donut" | "pie"

  const currentDataset = MACRO_DISTRIBUTIONS[activeTab];

  return (
    <section className="global-pie-panel">
      <div className="pie-panel-header">
        <div>
          <span className="eyebrow">GLOBAL MONETARY ALLOCATION & SHARE</span>
          <h3>{currentDataset.title}</h3>
        </div>

        <div className="pie-controls-row">
          <div className="pie-tabs">
            <button
              className={`pie-tab-btn ${activeTab === "fxReserves" ? "active" : ""}`}
              onClick={() => setActiveTab("fxReserves")}
            >
              FX Reserves (IMF)
            </button>
            <button
              className={`pie-tab-btn ${activeTab === "paymentRails" ? "active" : ""}`}
              onClick={() => setActiveTab("paymentRails")}
            >
              Payment Rails Volume
            </button>
            <button
              className={`pie-tab-btn ${activeTab === "swfAssets" ? "active" : ""}`}
              onClick={() => setActiveTab("swfAssets")}
            >
              SWF Wealth Assets
            </button>
          </div>

          <div className="pie-style-toggle">
            <button
              className={`style-toggle-btn ${chartType === "donut" ? "active" : ""}`}
              onClick={() => setChartType("donut")}
              title="Donut Graph"
            >
              ◎ Donut
            </button>
            <button
              className={`style-toggle-btn ${chartType === "pie" ? "active" : ""}`}
              onClick={() => setChartType("pie")}
              title="Solid Pie Graph"
            >
              ● Pie
            </button>
          </div>
        </div>
      </div>

      <div className="pie-content-split">
        <PieDonutCanvas slices={currentDataset.slices} isDonut={chartType === "donut"} size={140} />

        <div className="pie-slices-grid">
          {currentDataset.slices.map((slice, i) => (
            <div key={i} className="slice-item-card">
              <div className="slice-left">
                <span className="slice-color-dot" style={{ background: slice.color }} />
                <span className="slice-name">{slice.label}</span>
              </div>
              <div className="slice-right">
                <strong className="slice-pct">{slice.pct}%</strong>
                <small className="slice-val">{slice.value}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
