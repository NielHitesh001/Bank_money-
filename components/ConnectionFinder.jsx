import React, { useMemo, useState } from "react";
import { findBidirectionalPath, findDirectedPath } from "../lib/investigationUtils.mjs";

export default function ConnectionFinder({
  entities,
  transactions,
  selectedId,
  onSelectEntity,
  onSelectTransaction,
  onSetTrace,
}) {
  const [sourceId, setSourceId] = useState("BLACKROCK-US");
  const [targetId, setTargetId] = useState("JIO-IN");
  const [pathMode, setPathMode] = useState("any"); // "directed" | "any"
  const [isOpen, setIsOpen] = useState(true);

  const entityMap = useMemo(() => new Map(entities.map((e) => [e.id, e])), [entities]);
  const txMap = useMemo(() => new Map(transactions.map((tx) => [tx.id, tx])), [transactions]);

  // Compute active path
  const pathResult = useMemo(() => {
    if (!sourceId || !targetId || sourceId === targetId) {
      return { nodeIds: [sourceId].filter(Boolean), edgeIds: [] };
    }
    return pathMode === "directed"
      ? findDirectedPath(transactions, sourceId, targetId)
      : findBidirectionalPath(transactions, sourceId, targetId);
  }, [transactions, sourceId, targetId, pathMode]);

  // Automatically update the graph trace when path changes
  const applyPathToGraph = () => {
    onSetTrace(pathResult);
  };

  const swapEntities = () => {
    const prev = sourceId;
    setSourceId(targetId);
    setTargetId(prev);
  };

  const pathFound = pathResult.nodeIds.length > 1;

  return (
    <div className="connection-finder-bar">
      <div className="connection-finder-top">
        <div className="finder-heading">
          <span className="eyebrow">RELATIONSHIP & MONEY ROUTE DISCOVERY</span>
          <h3>Multi-Entity Connection Explorer</h3>
        </div>

        <div className="finder-mode-pills">
          <button
            className={`mode-pill ${pathMode === "any" ? "active" : ""}`}
            onClick={() => setPathMode("any")}
          >
            ⇄ Any Relationship (Joint Ventures & Corridors)
          </button>
          <button
            className={`mode-pill ${pathMode === "directed" ? "active" : ""}`}
            onClick={() => setPathMode("directed")}
          >
            ➔ Directed Cash Flows Only
          </button>
          <button className="collapse-btn" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? "Hide ▲" : "Show Finder ▼"}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="finder-body">
          <div className="finder-inputs-row">
            <div className="entity-select-field">
              <label>ENTITY A (ORIGIN)</label>
              <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                {entities.map((e) => (
                  <option key={`src-${e.id}`} value={e.id}>
                    {e.country ? `[${e.country}] ` : ""}{e.name} ({e.id})
                  </option>
                ))}
              </select>
            </div>

            <button className="finder-swap-btn" title="Swap Entities" onClick={swapEntities}>
              ⇄
            </button>

            <div className="entity-select-field">
              <label>ENTITY B (DESTINATION / TARGET)</label>
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                {entities.map((e) => (
                  <option key={`dst-${e.id}`} value={e.id}>
                    {e.country ? `[${e.country}] ` : ""}{e.name} ({e.id})
                  </option>
                ))}
              </select>
            </div>

            <button className="finder-action-btn primary" onClick={applyPathToGraph}>
              ◉ Trace On Graph
            </button>
          </div>

          {pathFound ? (
            <div className="connection-chain-card">
              <div className="chain-header">
                <span className="badge-connected">
                  ● CONNECTION FOUND ({pathResult.nodeIds.length - 1} {pathResult.nodeIds.length === 2 ? "HOP" : "HOPS"})
                </span>
                <small className="chain-summary">
                  Showing shortest connection route between <b>{entityMap.get(sourceId)?.name}</b> and{" "}
                  <b>{entityMap.get(targetId)?.name}</b>
                </small>
              </div>

              <div className="chain-steps-flow">
                {pathResult.nodeIds.map((nodeId, index) => {
                  const node = entityMap.get(nodeId);
                  const edgeId = pathResult.edgeIds[index];
                  const edge = txMap.get(edgeId);
                  const isNodeSelected = selectedId === nodeId;
                  const isEdgeSelected = selectedId === edgeId;

                  return (
                    <React.Fragment key={`hop-${nodeId}-${index}`}>
                      <div
                        className={`chain-node-box ${isNodeSelected ? "selected" : ""}`}
                        onClick={() => onSelectEntity(nodeId)}
                        title="Click to inspect node"
                      >
                        <span className="hop-rank">STEP {index + 1}</span>
                        <strong>{node?.name || nodeId}</strong>
                        <small>
                          {node?.kind} · {node?.country}
                        </small>
                      </div>

                      {edge && (
                        <div
                          className={`chain-edge-connector ${isEdgeSelected ? "selected" : ""}`}
                          onClick={() => onSelectTransaction(edgeId)}
                          title="Click to inspect transaction flow"
                        >
                          <span className="edge-arrow">➔</span>
                          <span className="edge-amount">{edge.display || `$${(edge.amount / 1e6).toFixed(1)}M`}</span>
                          <small className="edge-rail">{edge.rail}</small>
                          {edge.flag && <span className="edge-flag-pill">{edge.flag}</span>}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="connection-empty-state">
              <span>⚠ No direct path found between selected entities under current filter constraints.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
