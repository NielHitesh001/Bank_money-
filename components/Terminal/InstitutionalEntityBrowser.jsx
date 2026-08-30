import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import defaultEntities from "../../data/entities_large.json";
import defaultTransactions from "../../data/transactions_large.json";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8766";

const TYPE_COLORS = {
  CENTRAL_BANK: "#38bdf8",
  GSIB_TIER1: "#52d6aa",
  REGIONAL_BANK: "#f3ae52",
  SOVEREIGN_WEALTH: "#a78bfa",
  ASSET_MANAGER: "#60a5fa",
  HEDGE_FUND: "#f472b6",
  CLEARING_HOUSE: "#fbbf24",
};

export default function InstitutionalEntityBrowser({ onSelectEntity, onSelectTx }) {
  const [entities, setEntities] = useState(defaultEntities || []);
  const [transactions, setTransactions] = useState(defaultTransactions || []);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("graph"); // "graph" | "entities" | "transactions"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [minRisk, setMinRisk] = useState(0);
  const [anomaliesOnly, setAnomaliesOnly] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 550 });

  const containerRef = useRef(null);
  const fgRef = useRef(null);

  // Responsive container sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 900,
          height: containerRef.current.clientHeight || 550,
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [activeTab]);

  // Fetch from live API
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [entRes, txRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/entities`).then((r) => (r.ok ? r.json() : defaultEntities)),
          fetch(`${API_BASE}/api/v1/transactions`).then((r) => (r.ok ? r.json() : defaultTransactions)),
        ]);
        if (isMounted) {
          if (Array.isArray(entRes) && entRes.length > 0) setEntities(entRes);
          if (Array.isArray(txRes) && txRes.length > 0) setTransactions(txRes);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setEntities(defaultEntities);
          setTransactions(defaultTransactions);
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered Entities
  const filteredEntities = useMemo(() => {
    return entities.filter((e) => {
      if (selectedType !== "ALL" && e.type !== selectedType) return false;
      if (minRisk > 0 && (e.riskScore || 0) < minRisk) return false;
      if (anomaliesOnly && !e.ofacFlag && (e.riskScore || 0) < 50) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (e.name || "").toLowerCase().includes(q);
        const matchId = (e.id || "").toLowerCase().includes(q);
        const matchLei = (e.lei || "").toLowerCase().includes(q);
        const matchSwift = (e.swiftBic || "").toLowerCase().includes(q);
        if (!matchName && !matchId && !matchLei && !matchSwift) return false;
      }
      return true;
    });
  }, [entities, selectedType, minRisk, anomaliesOnly, searchQuery]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    const validEntityIds = new Set(filteredEntities.map((e) => e.id));
    return transactions.filter((t) => {
      if (anomaliesOnly && !t.isAnomalous) return false;
      if (!validEntityIds.has(t.sourceId || t.source) || !validEntityIds.has(t.targetId || t.target)) return false;
      return true;
    });
  }, [transactions, filteredEntities, anomaliesOnly]);

  // Graph Structure
  const graphData = useMemo(() => {
    const nodes = filteredEntities.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      country: e.countryCode,
      risk: e.riskScore,
      rating: e.rating,
      color: TYPE_COLORS[e.type] || "#52d6aa",
      val: e.type === "CENTRAL_BANK" ? 14 : e.type === "GSIB_TIER1" ? 10 : 6,
    }));

    const links = filteredTransactions.slice(0, 400).map((t) => ({
      id: t.id,
      source: t.sourceId || t.source,
      target: t.targetId || t.target,
      amount: t.amount,
      currency: t.currency,
      rail: t.rail,
      isAnomalous: t.isAnomalous,
      color: t.isAnomalous ? "#ff5b6e" : "rgba(100, 220, 177, 0.25)",
      width: t.isAnomalous ? 2.5 : 1,
    }));

    return { nodes, links };
  }, [filteredEntities, filteredTransactions]);

  const handleNodeClick = (node) => {
    const full = entities.find((e) => e.id === node.id);
    setSelectedEntity(full || node);
    if (onSelectEntity) onSelectEntity(full || node);
  };

  return (
    <div className="terminal-card" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "12px" }}>
      {/* Header & Controls Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "14px", fontWeight: "bold", color: "#64dcb1" }}>
            🌐 INSTITUTIONAL GRAPH & CLEARING NETWORK
          </span>
          <span className="badge-ok" style={{ fontSize: "10px" }}>
            {entities.length} NODES · {transactions.length} EDGES
          </span>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            className={`btn-ghost ${activeTab === "graph" ? "active" : ""}`}
            onClick={() => setActiveTab("graph")}
            style={{ fontSize: "11px", padding: "4px 8px" }}
          >
            🕸️ WebGL Graph
          </button>
          <button
            className={`btn-ghost ${activeTab === "entities" ? "active" : ""}`}
            onClick={() => setActiveTab("entities")}
            style={{ fontSize: "11px", padding: "4px 8px" }}
          >
            🏛️ Master Entities ({filteredEntities.length})
          </button>
          <button
            className={`btn-ghost ${activeTab === "transactions" ? "active" : ""}`}
            onClick={() => setActiveTab("transactions")}
            style={{ fontSize: "11px", padding: "4px 8px" }}
          >
            ⚡ Transactions ({filteredTransactions.length})
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px", background: "#0c1511", padding: "8px", borderRadius: "4px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by Name, LEI, SWIFT, ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ background: "#060a08", border: "1px solid #1a2c24", color: "#f0fdf4", padding: "4px 8px", fontSize: "11px", borderRadius: "3px", width: "220px" }}
        />

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{ background: "#060a08", border: "1px solid #1a2c24", color: "#76e2b5", padding: "4px 8px", fontSize: "11px", borderRadius: "3px" }}
        >
          <option value="ALL">All Entity Types</option>
          <option value="CENTRAL_BANK">Central Banks</option>
          <option value="GSIB_TIER1">G-SIBs (Tier 1)</option>
          <option value="REGIONAL_BANK">Regional Banks</option>
          <option value="SOVEREIGN_WEALTH">Sovereign Wealth</option>
          <option value="ASSET_MANAGER">Asset Managers</option>
          <option value="HEDGE_FUND">Hedge Funds</option>
          <option value="CLEARING_HOUSE">Clearing Houses</option>
        </select>

        <button
          onClick={() => setAnomaliesOnly(!anomaliesOnly)}
          style={{
            background: anomaliesOnly ? "rgba(255, 91, 110, 0.2)" : "#060a08",
            border: `1px solid ${anomaliesOnly ? "#ff5b6e" : "#1a2c24"}`,
            color: anomaliesOnly ? "#ff5b6e" : "#8da49c",
            padding: "4px 8px",
            fontSize: "11px",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          🚨 {anomaliesOnly ? "Anomalies Active" : "Filter Anomalies Only"}
        </button>

        <div style={{ marginLeft: "auto", fontSize: "11px", color: "#799088" }}>
          Min Risk: <strong style={{ color: minRisk > 50 ? "#ff5b6e" : "#f0fdf4" }}>{minRisk}</strong>
          <input
            type="range"
            min="0"
            max="80"
            value={minRisk}
            onChange={(e) => setMinRisk(Number(e.target.value))}
            style={{ verticalAlign: "middle", marginLeft: "6px", width: "80px" }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div ref={containerRef} style={{ flex: 1, minHeight: "480px", position: "relative", background: "#050807", borderRadius: "4px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#64dcb1" }}>
            ⚡ Loading Institutional Graph Network...
          </div>
        ) : activeTab === "graph" ? (
          <>
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeColor={(n) => n.color}
              nodeRelSize={4}
              linkColor={(l) => l.color}
              linkWidth={(l) => l.width}
              linkDirectionalArrowLength={3}
              linkDirectionalArrowRelPos={1}
              onNodeClick={handleNodeClick}
              backgroundColor="#050807"
            />
            {selectedEntity && (
              <div
                style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  background: "#0c1511",
                  border: "1px solid #1a2c24",
                  padding: "12px",
                  borderRadius: "4px",
                  width: "280px",
                  fontSize: "11px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <strong style={{ color: "#64dcb1" }}>{selectedEntity.name}</strong>
                  <button onClick={() => setSelectedEntity(null)} style={{ background: "none", border: "none", color: "#8da49c", cursor: "pointer" }}>✕</button>
                </div>
                <div>ID: <code>{selectedEntity.id}</code></div>
                <div>Country: {selectedEntity.countryName || selectedEntity.countryCode}</div>
                <div>LEI: <code>{selectedEntity.lei}</code></div>
                <div>SWIFT: <code>{selectedEntity.swiftBic}</code></div>
                <div>Rating: <span style={{ color: "#fbbf24" }}>{selectedEntity.rating}</span></div>
                <div>Risk Score: <strong style={{ color: selectedEntity.riskScore > 50 ? "#ff5b6e" : "#52d6aa" }}>{selectedEntity.riskScore} / 100</strong></div>
                {selectedEntity.ofacFlag && <div style={{ color: "#ff5b6e", marginTop: "4px" }}>⚠️ OFAC SANCTION PROXIMITY</div>}
              </div>
            )}
          </>
        ) : activeTab === "entities" ? (
          <div style={{ height: "100%", overflowY: "auto" }}>
            <table className="terminal-table" style={{ width: "100%", fontSize: "11px" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Institution Name</th>
                  <th>Type</th>
                  <th>Country</th>
                  <th>LEI</th>
                  <th>SWIFT/BIC</th>
                  <th>Rating</th>
                  <th>Tier 1 %</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntities.map((e) => (
                  <tr key={e.id} onClick={() => handleNodeClick(e)} style={{ cursor: "pointer" }}>
                    <td><code>{e.id}</code></td>
                    <td style={{ color: "#f0fdf4", fontWeight: "bold" }}>{e.name}</td>
                    <td><span style={{ color: TYPE_COLORS[e.type] || "#8da49c" }}>{e.category || e.type}</span></td>
                    <td>{e.countryCode}</td>
                    <td><code>{e.lei}</code></td>
                    <td><code>{e.swiftBic}</code></td>
                    <td style={{ color: "#fbbf24" }}>{e.rating}</td>
                    <td>{e.tier1Ratio}%</td>
                    <td>
                      <span style={{ color: e.riskScore > 50 ? "#ff5b6e" : "#52d6aa", fontWeight: "bold" }}>
                        {e.riskScore}
                      </span>
                    </td>
                    <td>
                      {e.ofacFlag ? (
                        <span style={{ color: "#ff5b6e", background: "rgba(255, 91, 110, 0.15)", padding: "2px 6px", borderRadius: "2px" }}>
                          FLAGGED
                        </span>
                      ) : (
                        <span style={{ color: "#52d6aa" }}>ACTIVE</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ height: "100%", overflowY: "auto" }}>
            <table className="terminal-table" style={{ width: "100%", fontSize: "11px" }}>
              <thead>
                <tr>
                  <th>Tx ID</th>
                  <th>Source Entity</th>
                  <th>Target Entity</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Clearing Rail</th>
                  <th>Risk</th>
                  <th>Timestamp</th>
                  <th>AML / Anomaly Flag</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => (
                  <tr key={t.id}>
                    <td><code>{t.id}</code></td>
                    <td>{t.sourceName || t.sourceId || t.source}</td>
                    <td>{t.targetName || t.targetId || t.target}</td>
                    <td style={{ color: "#f0fdf4", fontWeight: "bold" }}>
                      ${t.amount ? Number(t.amount).toLocaleString() : t.display}
                    </td>
                    <td style={{ color: "#76e2b5" }}>{t.currency}</td>
                    <td><code>{t.rail}</code></td>
                    <td>
                      <span style={{ color: (t.riskScore || t.risk) > 50 ? "#ff5b6e" : "#52d6aa" }}>
                        {t.riskScore || t.risk}
                      </span>
                    </td>
                    <td style={{ color: "#799088" }}>{t.timestamp || t.date}</td>
                    <td>
                      {t.isAnomalous || t.flag ? (
                        <span style={{ color: "#ff5b6e", background: "rgba(255, 91, 110, 0.15)", padding: "2px 6px", borderRadius: "2px" }}>
                          🚨 {t.anomalyType || t.flag}
                        </span>
                      ) : (
                        <span style={{ color: "#52d6aa" }}>SETTLED</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
