import React, { useMemo, useState } from "react";
import { CENTRAL_BANKS_DATA } from "../data/centralBanksData.js";

export { CENTRAL_BANKS_DATA };

export default function CentralBankPolicyHub() {
  const [viewMode, setViewMode] = useState("table"); // "table" | "cards"
  const [search, setSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState(CENTRAL_BANKS_DATA[0]);
  const [sortField, setSortField] = useState("rate");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredBanks = useMemo(() => {
    let list = CENTRAL_BANKS_DATA;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
        `${b.country} ${b.institution} ${b.currency} ${b.cbdc} ${b.rateType}`.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
  }, [search, sortField, sortAsc]);

  return (
    <section className="dashboard-panel central-bank-panel">
      <div className="panel-heading">
        <div className="cb-head-left">
          <span className="eyebrow">MONETARY AUTHORITIES & POLICY BENCHMARKS</span>
          <h2>Central Bank Policy Hub & Global Rate Monitor</h2>
        </div>
        <div className="cb-head-right" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="view-mode-toggle-group">
            <button
              className={`view-mode-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              ▤ Bloomberg Full List
            </button>
            <button
              className={`view-mode-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
            >
              🗂 Cards Grid
            </button>
          </div>
          <span className="cb-badge">{filteredBanks.length} Central Banks Tracked</span>
        </div>
      </div>

      <div className="cb-search-bar">
        <input
          type="text"
          placeholder="Filter by country, central bank, currency, or CBDC stage..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {viewMode === "table" ? (
        <div className="blotter-table-wrapper" style={{ maxHeight: "460px", marginBottom: "16px" }}>
          <table className="bloomberg-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("country")}>
                  COUNTRY / REGION {sortField === "country" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("institution")}>
                  MONETARY AUTHORITY {sortField === "institution" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("rate")}>
                  POLICY RATE {sortField === "rate" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th>BENCHMARK TYPE</th>
                <th onClick={() => handleSort("currency")}>
                  CURRENCY {sortField === "currency" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("fxUsd")}>
                  FX RATE (VS USD) {sortField === "fxUsd" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th>CBDC PROGRESS</th>
                <th>MANDATE SUMMARY</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanks.map((bank) => {
                const isSelected = selectedBank?.cca3 === bank.cca3;
                return (
                  <tr
                    key={bank.cca3}
                    className={`blotter-row ${isSelected ? "selected-row" : ""}`}
                    onClick={() => setSelectedBank(bank)}
                  >
                    <td>
                      <strong style={{ color: "#f0fdf4", marginRight: "6px" }}>{bank.flag} {bank.country}</strong>
                      <small style={{ color: "#647771" }}>({bank.cca3})</small>
                    </td>
                    <td>
                      <span className="entity-name-cell">{bank.institution}</span>
                    </td>
                    <td>
                      <span
                        className="cb-rate-pill"
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          display: "inline-block",
                        }}
                      >
                        {bank.rate.toFixed(2)}%
                      </span>
                    </td>
                    <td>
                      <small style={{ color: "#8ea49d" }}>{bank.rateType}</small>
                    </td>
                    <td>
                      <span className="ccy-tag">{bank.currency}</span>
                    </td>
                    <td>
                      <strong>${bank.fxUsd.toFixed(4)}</strong>
                    </td>
                    <td>
                      <span className="cbdc-tag">{bank.cbdc}</span>
                    </td>
                    <td style={{ maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ color: "#8ea49d", fontSize: "10px" }}>{bank.mandate}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="cb-cards-grid">
          {filteredBanks.map((bank) => (
            <article
              key={bank.cca3}
              className={`cb-card ${selectedBank?.cca3 === bank.cca3 ? "active" : ""}`}
              onClick={() => setSelectedBank(bank)}
            >
              <div className="cb-card-top">
                <span className="cb-flag">{bank.flag}</span>
                <div>
                  <strong>{bank.country}</strong>
                  <small>{bank.institution}</small>
                </div>
                <span className="cb-rate-pill">{bank.rate.toFixed(2)}%</span>
              </div>

              <div className="cb-card-body">
                <div className="cb-meta-row">
                  <span>Currency</span>
                  <strong>
                    {bank.currency} <small>(1 {bank.currency} = ${bank.fxUsd.toFixed(4)} USD)</small>
                  </strong>
                </div>
                <div className="cb-meta-row">
                  <span>Benchmark</span>
                  <small>{bank.rateType}</small>
                </div>
                <div className="cb-meta-row">
                  <span>CBDC Status</span>
                  <span className="cbdc-tag">{bank.cbdc}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedBank && (
        <footer className="cb-detail-footer">
          <span className="eyebrow">MANDATE & MONETARY STRATEGY</span>
          <h4>
            {selectedBank.flag} {selectedBank.institution} — {selectedBank.country} ({selectedBank.currency} · Policy: {selectedBank.rate.toFixed(2)}%)
          </h4>
          <p>{selectedBank.mandate}</p>
        </footer>
      )}
    </section>
  );
}
