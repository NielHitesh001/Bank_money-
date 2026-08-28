import React, { useMemo, useState } from "react";
import NetworkCanvas from "./components/NetworkCanvas";
import { cases, entities, transactions } from "./data/intelligenceMock";
import "./styles.css";

const formats = { entity: "Entity", transaction: "Transaction" };
const riskLabel = (risk) => risk >= 80 ? "Critical" : risk >= 55 ? "Elevated" : "Standard";

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [minimumRisk, setMinimumRisk] = useState(0);
  const [currency, setCurrency] = useState("All currencies");
  const [selected, setSelected] = useState({ type: "transaction", value: "TX-2026-08494" });
  const [traceMode, setTraceMode] = useState(true);
  const [audit, setAudit] = useState(["09:42 — session authenticated", "09:44 — trace started: Baltic routing anomaly"]);

  const visibleTransactions = useMemo(() => transactions.filter((tx) =>
    tx.risk >= minimumRisk && (currency === "All currencies" || tx.currency === currency) &&
    (!query || [tx.id, tx.currency, tx.rail, tx.flag].filter(Boolean).join(" ").toLowerCase().includes(query.toLowerCase()) ||
      entities.some((e) => (e.id === tx.source || e.id === tx.target) && e.name.toLowerCase().includes(query.toLowerCase())))
  ), [query, minimumRisk, currency]);
  const entityIds = new Set(visibleTransactions.flatMap((tx) => [tx.source, tx.target]));
  const visibleEntities = entities.filter((entity) => entityIds.has(entity.id));
  const selectedObject = selected.type === "entity" ? entities.find((entity) => entity.id === selected.value) : transactions.find((tx) => tx.id === selected.value);
  const select = (next) => { setSelected(next); setAudit((events) => [`09:4${events.length + 5} — inspected ${formats[next.type].toLowerCase()} ${next.value}`, ...events].slice(0, 4)); };
  const inspectItem = selected.type === "entity" ? selectedObject : entities.find((entity) => entity.id === selectedObject?.target);

  return <main className="intel-app">
    <header className="topbar">
      <div className="brand"><span className="brand-glyph">M</span><span>MoneyTrace</span><small>INTELLIGENCE</small></div>
      <nav><button className="active">Investigate</button><button>Cases <b>03</b></button><button>Watchlists</button><button>Audit</button></nav>
      <div className="operator"><span className="live-dot" /> Secure session <span className="avatar">AN</span></div>
    </header>

    <section className="commandbar">
      <div className="breadcrumb">INVESTIGATIONS <i>/</i> CASE-1842 <strong>Baltic routing anomaly</strong></div>
      <div className="command-actions"><button onClick={() => setTraceMode(!traceMode)} className={traceMode ? "trace-on" : ""}>◉ {traceMode ? "Tracing active" : "Trace path"}</button><button onClick={() => setAudit((items) => ["09:49 — export requested: JSON report", ...items])}>Export</button><button className="primary">+ Add to case</button></div>
    </section>

    <section className="workbench">
      <aside className="filter-rail">
        <div className="rail-title"><span>ANALYSIS CONTROLS</span><button onClick={() => { setQuery(""); setMinimumRisk(0); setCurrency("All currencies"); }}>Reset</button></div>
        <label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search entity or transaction" /></label>
        <fieldset><legend>Transaction risk</legend><div className="risk-scale"><span>Any</span><output>{minimumRisk || "All"}</output></div><input aria-label="Minimum transaction risk" type="range" min="0" max="90" step="10" value={minimumRisk} onChange={(e) => setMinimumRisk(Number(e.target.value))} /><div className="range-ends"><span>0</span><span>90+</span></div></fieldset>
        <fieldset><legend>Currency</legend>{["All currencies", "USD", "EUR", "GBP", "AED"].map((item) => <label className="choice" key={item}><input type="radio" name="currency" checked={currency === item} onChange={() => setCurrency(item)} />{item}</label>)}</fieldset>
        <fieldset><legend>Flow type</legend><label className="choice"><input type="checkbox" defaultChecked /> Cross-border only</label><label className="choice"><input type="checkbox" defaultChecked /> Flagged flows</label></fieldset>
        <div className="scope"><span>VIEW SCOPE</span><strong>{visibleEntities.length} entities · {visibleTransactions.length} transfers</strong><small>Rendered view is isolated from raw source records.</small></div>
      </aside>

      <section className="graph-shell">
        <div className="graph-header"><div><span className="eyebrow">LIVE RELATIONSHIP GRAPH</span><h1>Cross-border transaction network</h1></div><div className="graph-stat"><span>EXPOSURE</span><strong>$258.7M</strong><small>LAST 24 HOURS</small></div></div>
        <div className="graph-wrap"><NetworkCanvas entities={visibleEntities} transactions={visibleTransactions} selectedId={selected.value} onSelect={select} /><div className="graph-tools"><button>＋</button><button>−</button><button>⊙</button></div><div className="legend"><span><i className="low" />Standard</span><span><i className="mid" />Elevated</span><span><i className="high" />Critical</span><em>Click a node or flow to inspect</em></div></div>
      </section>

      <aside className="inspector">
        <div className="inspector-title"><div><span className="eyebrow">{formats[selected.type].toUpperCase()} INSPECTOR</span><h2>{selectedObject?.id || "No selection"}</h2></div><button onClick={() => setSelected({ type: "transaction", value: "TX-2026-08494" })}>×</button></div>
        {selectedObject && <>
          <div className={`risk-banner risk-${riskLabel(selectedObject.risk).toLowerCase()}`}><span>RISK SCORE</span><strong>{selectedObject.risk}<small>/100</small></strong><em>{riskLabel(selectedObject.risk)}</em></div>
          <section className="detail-block"><h3>{selected.type === "transaction" ? "Flow detail" : "Institution detail"}</h3>
            {selected.type === "transaction" ? <dl><div><dt>Amount</dt><dd>{selectedObject.display} {selectedObject.currency}</dd></div><div><dt>Rail</dt><dd>{selectedObject.rail}</dd></div><div><dt>Timestamp</dt><dd>{selectedObject.date}</dd></div><div><dt>Alert reason</dt><dd className="danger">{selectedObject.flag || "No active alert"}</dd></div></dl> : <dl><div><dt>Legal name</dt><dd>{selectedObject.name}</dd></div><div><dt>Jurisdiction</dt><dd>{selectedObject.country}</dd></div><div><dt>BIC / SWIFT</dt><dd>{selectedObject.bic || "—"}</dd></div><div><dt>LEI / Account</dt><dd>{selectedObject.lei || selectedObject.account}</dd></div></dl>}
          </section>
          <section className="detail-block counterpart"><h3>Selected endpoint</h3><strong>{inspectItem?.name}</strong><span>{inspectItem?.kind} · {inspectItem?.country}</span><button className="secondary" onClick={() => select({ type: "entity", value: inspectItem?.id })}>Inspect entity →</button></section>
          <section className="detail-block audit-mini"><h3>Case activity</h3>{audit.map((event) => <p key={event}>{event}</p>)}</section>
        </>}
      </aside>
    </section>

    <section className="casebar"><div className="case-label"><span>OPEN CASES</span><strong>Priority queue</strong></div>{cases.map((item) => <button key={item.id} className="case-card"><span className={`severity ${item.severity.toLowerCase()}`} /> <b>{item.id}</b><strong>{item.title}</strong><small>{item.transactions} transactions · {item.updated}</small></button>)}<button className="case-more">View all cases →</button></section>
  </main>;
}
