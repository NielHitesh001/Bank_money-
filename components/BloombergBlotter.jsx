import React, { useMemo, useState } from "react";

const riskLabel = (risk) => (risk >= 80 ? "Critical" : risk >= 55 ? "Elevated" : "Standard");
const riskClass = (risk) => (risk >= 80 ? "risk-tag-critical" : risk >= 55 ? "risk-tag-elevated" : "risk-tag-standard");

export default function BloombergBlotter({
  entities,
  transactions,
  selectedId,
  onSelect,
  onTraceOrigin,
  onAddToCase,
  activeCaseId,
  role,
}) {
  const [subTab, setSubTab] = useState("transactions"); // "transactions" | "entities"
  const [sortField, setSortField] = useState("risk");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterText, setFilterText] = useState("");

  const entityMap = useMemo(() => new Map(entities.map((e) => [e.id, e])), [entities]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedTransactions = useMemo(() => {
    const list = transactions.filter((tx) => {
      if (!filterText) return true;
      const q = filterText.toLowerCase();
      const s = entityMap.get(tx.source)?.name || "";
      const t = entityMap.get(tx.target)?.name || "";
      return (
        tx.id.toLowerCase().includes(q) ||
        tx.currency.toLowerCase().includes(q) ||
        tx.rail.toLowerCase().includes(q) ||
        (tx.flag && tx.flag.toLowerCase().includes(q)) ||
        s.toLowerCase().includes(q) ||
        t.toLowerCase().includes(q)
      );
    });

    return list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === "source") valA = entityMap.get(a.source)?.name || a.source;
      if (sortField === "target") valB = entityMap.get(b.target)?.name || b.target;
      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
  }, [transactions, entityMap, filterText, sortField, sortAsc]);

  const sortedEntities = useMemo(() => {
    const list = entities.filter((e) => {
      if (!filterText) return true;
      const q = filterText.toLowerCase();
      return (
        e.id.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.country.toLowerCase().includes(q) ||
        e.kind.toLowerCase().includes(q)
      );
    });

    return list.sort((a, b) => {
      const valA = a[sortField] ?? "";
      const valB = b[sortField] ?? "";
      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
  }, [entities, filterText, sortField, sortAsc]);

  return (
    <div className="bloomberg-blotter-container">
      <div className="blotter-toolbar">
        <div className="blotter-tabs">
          <button
            className={`blotter-tab-btn ${subTab === "transactions" ? "active" : ""}`}
            onClick={() => {
              setSubTab("transactions");
              setSortField("risk");
              setSortAsc(false);
            }}
          >
            📋 ALL FLOWS BLOTTER ({transactions.length})
          </button>
          <button
            className={`blotter-tab-btn ${subTab === "entities" ? "active" : ""}`}
            onClick={() => {
              setSubTab("entities");
              setSortField("risk");
              setSortAsc(false);
            }}
          >
            🏛 INSTITUTION DIRECTORY ({entities.length})
          </button>
        </div>

        <div className="blotter-quick-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder={`Filter ${subTab}...`}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          {filterText && <button onClick={() => setFilterText("")}>×</button>}
        </div>
      </div>

      <div className="blotter-table-wrapper">
        {subTab === "transactions" ? (
          <table className="bloomberg-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("id")}>TX ID {sortField === "id" ? (sortAsc ? "▲" : "▼") : ""}</th>
                <th onClick={() => handleSort("date")}>TIMESTAMP {sortField === "date" ? (sortAsc ? "▲" : "▼") : ""}</th>
                <th onClick={() => handleSort("amount")}>AMOUNT {sortField === "amount" ? (sortAsc ? "▲" : "▼") : ""}</th>
                <th onClick={() => handleSort("currency")}>CCY</th>
                <th onClick={() => handleSort("rail")}>PAYMENT RAIL</th>
                <th onClick={() => handleSort("source")}>SOURCE INSTITUTION</th>
                <th onClick={() => handleSort("target")}>DESTINATION INSTITUTION</th>
                <th onClick={() => handleSort("risk")}>RISK SCORE {sortField === "risk" ? (sortAsc ? "▲" : "▼") : ""}</th>
                <th>ALERT SIGNAL</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((tx) => {
                const isSelected = selectedId === tx.id;
                const source = entityMap.get(tx.source);
                const target = entityMap.get(tx.target);
                return (
                  <tr
                    key={tx.id}
                    className={`blotter-row ${isSelected ? "selected-row" : ""}`}
                    onClick={() => onSelect({ type: "transaction", value: tx.id })}
                  >
                    <td>
                      <strong className="tx-id-cell">{tx.id}</strong>
                    </td>
                    <td className="timestamp-cell">{tx.date}</td>
                    <td className="amount-cell">
                      <strong>{tx.display || `$${(tx.amount / 1e6).toFixed(2)}M`}</strong>
                    </td>
                    <td><span className="ccy-tag">{tx.currency}</span></td>
                    <td><span className="rail-tag">{tx.rail}</span></td>
                    <td title={source?.name}>
                      <span className="entity-cell">
                        <b>{source?.country || "—"}</b> {source?.name || tx.source}
                      </span>
                    </td>
                    <td title={target?.name}>
                      <span className="entity-cell">
                        <b>{target?.country || "—"}</b> {target?.name || tx.target}
                      </span>
                    </td>
                    <td>
                      <span className={`risk-badge ${riskClass(tx.risk)}`}>
                        {tx.risk} · {riskLabel(tx.risk)}
                      </span>
                    </td>
                    <td>
                      {tx.flag ? (
                        <span className="flag-danger-badge">⚠ {tx.flag}</span>
                      ) : (
                        <span className="flag-clear-badge">—</span>
                      )}
                    </td>
                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="blotter-action-btn"
                        title="Inspect in side panel"
                        onClick={() => onSelect({ type: "transaction", value: tx.id })}
                      >
                        Inspect →
                      </button>
                      {role !== "Analyst" && (
                        <button
                          className="blotter-action-btn primary"
                          title={`Add to ${activeCaseId}`}
                          onClick={() => {
                            onSelect({ type: "transaction", value: tx.id });
                            onAddToCase(tx.id);
                          }}
                        >
                          + Case
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="bloomberg-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("id")}>ENTITY ID {sortField === "id" ? (sortAsc ? "▲" : "▼") : ""}</th>
                <th onClick={() => handleSort("name")}>LEGAL INSTITUTION NAME {sortField === "name" ? (sortAsc ? "▲" : "▼") : ""}</th>
                <th onClick={() => handleSort("kind")}>KIND {sortField === "kind" ? (sortAsc ? "▲" : "▼") : ""}</th>
                <th onClick={() => handleSort("country")}>JURISDICTION {sortField === "country" ? (sortAsc ? "▲" : "▼") : ""}</th>
                <th>IDENTIFIER (BIC / LEI)</th>
                <th onClick={() => handleSort("risk")}>RISK SCORE {sortField === "risk" ? (sortAsc ? "▲" : "▼") : ""}</th>
                <th>PEP SCREENING</th>
                <th>SANCTIONS</th>
                <th>TYPOLOGIES</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntities.map((entity) => {
                const isSelected = selectedId === entity.id;
                return (
                  <tr
                    key={entity.id}
                    className={`blotter-row ${isSelected ? "selected-row" : ""}`}
                    onClick={() => onSelect({ type: "entity", value: entity.id })}
                  >
                    <td>
                      <strong className="entity-id-cell">{entity.id}</strong>
                    </td>
                    <td>
                      <span className="entity-name-cell">{entity.name}</span>
                    </td>
                    <td>
                      <span className="kind-tag">{entity.kind}</span>
                    </td>
                    <td>
                      <span className="country-tag">🏛 {entity.country}</span>
                    </td>
                    <td className="mono-cell">
                      {entity.bic || entity.lei || entity.account || "—"}
                    </td>
                    <td>
                      <span className={`risk-badge ${riskClass(entity.risk)}`}>
                        {entity.risk} · {riskLabel(entity.risk)}
                      </span>
                    </td>
                    <td>
                      <span className={entity.aml?.pep !== "Clear" ? "flag-danger-badge" : "flag-clear-badge"}>
                        {entity.aml?.pep || "Clear"}
                      </span>
                    </td>
                    <td>
                      <span className={entity.aml?.sanctions !== "No match" ? "flag-danger-badge" : "flag-clear-badge"}>
                        {entity.aml?.sanctions || "No match"}
                      </span>
                    </td>
                    <td>
                      {entity.aml?.typologies?.length ? (
                        <span className="typology-pill">{entity.aml.typologies.join(", ")}</span>
                      ) : (
                        <span className="flag-clear-badge">—</span>
                      )}
                    </td>
                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="blotter-action-btn"
                        onClick={() => onSelect({ type: "entity", value: entity.id })}
                      >
                        Inspect →
                      </button>
                      <button
                        className="blotter-action-btn trace"
                        title={`Trace path from ${entity.id}`}
                        onClick={() => onTraceOrigin(entity.id)}
                      >
                        ◉ Trace
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="blotter-footer">
        <span>
          BLOOMBERG TERMINAL DATA GRID · DISPLAYING {subTab === "transactions" ? sortedTransactions.length : sortedEntities.length} RECORDS
        </span>
        <span className="status-live-mono">● LIVE INTERBANK STREAM</span>
      </div>
    </div>
  );
}
