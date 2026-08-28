import React, { useEffect, useMemo, useState } from "react";
import Graph from "graphology";
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSigma } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";

const riskColor = (risk) => risk >= 80 ? "#ff5b6e" : risk >= 55 ? "#f3ae52" : "#52d6aa";

function GraphLoader({ entities, transactions, selectedId, onSelect }) {
  const loadGraph = useLoadGraph();
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();
  useEffect(() => {
    const graph = new Graph({ type: "directed", multi: true });
    entities.forEach((entity) => graph.addNode(entity.id, {
      ...entity, label: entity.name, x: entity.x * 100, y: entity.y * 100,
      size: selectedId === entity.id ? 16 : entity.risk >= 80 ? 12 : 10,
      color: riskColor(entity.risk), zIndex: selectedId === entity.id ? 2 : 1,
    }));
    transactions.forEach((tx) => graph.addDirectedEdgeWithKey(tx.id, tx.source, tx.target, {
      ...tx, size: selectedId === tx.id || selectedId === tx.source || selectedId === tx.target ? 2.8 : 1.2,
      color: tx.risk >= 80 ? "#ff5b6e" : "#385250", label: tx.display,
    }));
    loadGraph(graph);
    sigma.getCamera().animatedReset({ duration: 300 });
  }, [entities, transactions, selectedId, loadGraph, sigma]);
  useEffect(() => registerEvents({
    clickNode: ({ node }) => onSelect({ type: "entity", value: node }),
    clickEdge: ({ edge }) => onSelect({ type: "transaction", value: edge }),
  }), [registerEvents, onSelect]);
  return null;
}

export default function NetworkCanvas({ entities, transactions, selectedId, onSelect }) {
  return <SigmaContainer className="sigma-stage" settings={{ renderEdgeLabels: false, defaultEdgeType: "arrow", labelRenderedSizeThreshold: 9, labelFont: "IBM Plex Mono", labelColor: { color: "#d2dfda" }, zIndex: true }}>
    <GraphLoader entities={entities} transactions={transactions} selectedId={selectedId} onSelect={onSelect} />
  </SigmaContainer>;
}
