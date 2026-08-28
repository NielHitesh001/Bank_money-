import React, { useMemo, useState } from "react";
import { CENTRAL_BANKS_DATA } from "../data/centralBanksData.js";

export { CENTRAL_BANKS_DATA };

export default function CentralBankPolicyHub() {
  const [search, setSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState(CENTRAL_BANKS_DATA[0]);

  const filteredBanks = useMemo(() => {
    if (!search) return CENTRAL_BANKS_DATA;
    const q = search.toLowerCase();
    return CENTRAL_BANKS_DATA.filter((b) =>
      `${b.country} ${b.institution} ${b.currency} ${b.cbdc}`.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <section className="dashboard-panel central-bank-panel">
      <div className="panel-heading">
        <div className="cb-head-left">
          <span className="eyebrow">MONETARY AUTHORITIES & POLICY BENCHMARKS</span>
          <h2>Central Bank Policy Hub</h2>
        </div>
        <div className="cb-head-right">
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
                <strong>{bank.currency} <small>(1 {bank.currency} = ${bank.fxUsd.toFixed(4)} USD)</small></strong>
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

      {selectedBank && (
        <footer className="cb-detail-footer">
          <span className="eyebrow">MANDATE & MONETARY STRATEGY</span>
          <h4>{selectedBank.institution} — {selectedBank.country}</h4>
          <p>{selectedBank.mandate}</p>
        </footer>
      )}
    </section>
  );
}
