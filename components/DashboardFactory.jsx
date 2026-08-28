import React from "react";
import EntityGraph from "./EntityGraph";

const bids = [["189.42", "1,240"], ["189.40", "860"], ["189.38", "2,110"], ["189.35", "460"], ["189.31", "1,870"]];
const asks = [["189.46", "620"], ["189.49", "1,450"], ["189.52", "780"], ["189.56", "2,340"], ["189.60", "1,090"]];

function PanelHeader({ eyebrow, title }) {
  return <div className="panel-heading"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>;
}

function OrderRow({ price, size, side }) {
  const [currentPrice, setCurrentPrice] = React.useState(Number(price));
  const [direction, setDirection] = React.useState("");

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentPrice((previousPrice) => {
        const nextPrice = previousPrice + (Math.random() > 0.5 ? 0.01 : -0.01);
        setDirection(nextPrice > previousPrice ? "tick-up" : "tick-down");
        return nextPrice;
      });
    }, 1400 + Math.random() * 1600);
    return () => window.clearInterval(interval);
  }, []);

  return <div className={`book-row ${direction} ${side}`}><span>{currentPrice.toFixed(2)}</span><span>{size}</span></div>;
}

function OrderGrid() {
  return <section className="dashboard-panel order-panel">
    <PanelHeader eyebrow="NASDAQ · AAPL" title="Market depth" />
    <div className="quote-strip"><strong>$189.44</strong><span className="positive">+1.28%</span><span className="muted">Vol 42.8M</span></div>
    <div className="book-columns"><span>Price</span><span>Size</span></div>
    <div className="book-list asks">{asks.map(([price, size]) => <OrderRow key={price} price={price} size={size} side="ask" />)}</div>
    <div className="spread"><span>Spread 0.02</span><span>Mid 189.44</span></div>
    <div className="book-list bids">{bids.map(([price, size]) => <OrderRow key={price} price={price} size={size} side="bid" />)}</div>
  </section>;
}

function Chart() {
  return <section className="dashboard-panel chart-panel">
    <PanelHeader eyebrow="AAPL · 1D" title="Price action" />
    <div className="chart-meta"><span className="positive">$189.44</span><span className="muted">High $190.12 · Low $186.88</span></div>
    <div className="chart" aria-label="AAPL price chart"><div className="chart-grid" /><svg viewBox="0 0 700 280" preserveAspectRatio="none" role="img" aria-label="Rising AAPL line chart"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#76e2b5" stopOpacity=".28" /><stop offset="1" stopColor="#76e2b5" stopOpacity="0" /></linearGradient></defs><path d="M0 224 L55 212 L105 218 L160 175 L215 188 L270 146 L320 162 L375 114 L430 132 L480 90 L535 104 L585 58 L640 76 L700 32 V280 H0Z" fill="url(#area)" /><path d="M0 224 L55 212 L105 218 L160 175 L215 188 L270 146 L320 162 L375 114 L430 132 L480 90 L535 104 L585 58 L640 76 L700 32" fill="none" stroke="#76e2b5" strokeWidth="3" /></svg></div>
    <div className="chart-axis"><span>09:30</span><span>12:00</span><span>14:30</span><span>16:00</span></div>
  </section>;
}

function News() {
  const stories = [["08:42", "Apple suppliers signal stronger September production run", "EQUITIES"], ["08:16", "Treasury yields edge higher before inflation data", "MACRO"], ["07:58", "Asian markets close mixed as dollar steadies", "GLOBAL"]];
  return <section className="dashboard-panel news-panel"><PanelHeader eyebrow="WIRE · LIVE" title="Market pulse" />{stories.map(([time, title, tag]) => <article className="story" key={title}><time>{time}</time><div><h3>{title}</h3><span>{tag}</span></div></article>)}</section>;
}

function Terminal() {
  return <section className="dashboard-panel terminal-panel"><PanelHeader eyebrow="SYSTEM · READY" title="Terminal" /><div className="terminal-output"><p><span className="terminal-green">moneytrace</span> / market snapshot</p><p className="muted">Connected to global price stream</p><p><span className="terminal-green">$</span> watch AAPL --depth 5</p><p className="muted">Bid 189.42 x 1,240</p><p className="muted">Ask 189.46 x 620</p><p><span className="terminal-green">$</span> <span className="cursor" /></p></div></section>;
}

export function dashboardFactory(node) {
  switch (node.getComponent()) {
    case "orderGrid": return <OrderGrid />;
    case "chart": return <Chart />;
    case "news": return <News />;
    case "terminal": return <Terminal />;
    case "entityGraph": return <EntityGraph />;
    default: return <div className="missing-component">Component not found</div>;
  }
}