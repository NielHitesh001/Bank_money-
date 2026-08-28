import React, { useMemo, useState } from "react";
import { PAYMENT_RAILS_DATA } from "../data/paymentRailsData.js";

export { PAYMENT_RAILS_DATA };

export default function PaymentRailsMatrix() {
  const [filterType, setFilterType] = useState("ALL");
  const [query, setQuery] = useState("");
  const [selectedRail, setSelectedRail] = useState(PAYMENT_RAILS_DATA[0]);

  const filteredRails = useMemo(() => {
    return PAYMENT_RAILS_DATA.filter((rail) => {
      if (filterType === "RTGS" && !rail.type.includes("RTGS")) return false;
      if (filterType === "INSTANT" && !rail.type.toLowerCase().includes("instant")) return false;
      if (filterType === "MESSAGING" && !rail.type.toLowerCase().includes("messaging")) return false;
      if (query) {
        const q = query.toLowerCase();
        const text = `${rail.id} ${rail.name} ${rail.operator} ${rail.currency} ${rail.type}`.toLowerCase();
        return text.includes(q);
      }
      return true;
    });
  }, [filterType, query]);

  return (
    <section className="dashboard-panel rails-panel">
      <div className="panel-heading">
        <div className="rails-head-left">
          <span className="eyebrow">GLOBAL PAYMENT RAILS & CLEARING SYSTEMS</span>
          <h2>Payment Infrastructure Matrix</h2>
        </div>
        <div className="rails-head-right">
          <span className="rail-count-badge">{filteredRails.length} Rails Active</span>
        </div>
      </div>

      <div className="rails-controls-strip">
        <div className="filter-buttons">
          {["ALL", "RTGS", "INSTANT", "MESSAGING"].map((type) => (
            <button
              key={type}
              className={`filter-btn ${filterType === type ? "active" : ""}`}
              onClick={() => setFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="rails-search"
          placeholder="Filter by rail name, currency, operator..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="rails-grid-container">
        <div className="rails-table-wrap">
          <table className="rails-table">
            <thead>
              <tr>
                <th>Rail</th>
                <th>Operator</th>
                <th>Currency</th>
                <th>Type</th>
                <th>Hours</th>
                <th>Daily Vol</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRails.map((rail) => (
                <tr
                  key={rail.id}
                  className={`rail-row ${selectedRail?.id === rail.id ? "selected" : ""}`}
                  onClick={() => setSelectedRail(rail)}
                >
                  <td className="rail-cell-id">
                    <strong>{rail.id}</strong>
                    <small>{rail.name}</small>
                  </td>
                  <td>{rail.operator}</td>
                  <td><span className="currency-pill">{rail.currency.split(" ")[0]}</span></td>
                  <td><span className="type-tag">{rail.type.split("(")[0].trim()}</span></td>
                  <td>{rail.hours}</td>
                  <td><strong>{rail.avgDailyVol}</strong></td>
                  <td>
                    <span className={`status-pill ${rail.status === "OPEN" ? "open" : "closed"}`}>
                      ● {rail.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedRail && (
          <aside className="rail-detail-card">
            <div className="rail-card-head">
              <span className="eyebrow">RAIL INSPECTOR</span>
              <h3>{selectedRail.name} ({selectedRail.id})</h3>
            </div>
            <p className="rail-desc">{selectedRail.description}</p>
            <dl className="rail-meta-list">
              <div>
                <dt>Operator</dt>
                <dd>{selectedRail.operator}</dd>
              </div>
              <div>
                <dt>Clearing Mechanism</dt>
                <dd>{selectedRail.settlement}</dd>
              </div>
              <div>
                <dt>Message Standard</dt>
                <dd>{selectedRail.standard}</dd>
              </div>
              <div>
                <dt>Operating Window</dt>
                <dd>{selectedRail.hours}</dd>
              </div>
              <div>
                <dt>Estimated Daily Volume</dt>
                <dd className="highlight">{selectedRail.avgDailyVol}</dd>
              </div>
            </dl>
          </aside>
        )}
      </div>
    </section>
  );
}
