import React, { useEffect, useMemo, useState } from "react";
import Graph from "graphology";
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSigma } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";

const riskColor = (risk) => risk >= 80 ? "#ff5b6e" : risk >= 55 ? "#f3ae52" : "#52d6aa";

function GraphLoader({ entities, transactions, selectedId, trace, onSelect, actionsRef }) {
  const loadGraph = useLoadGraph();
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();
  useEffect(() => {
    const graph = new Graph({ type: "directed", multi: true });
    entities.forEach((entity) => graph.addNode(entity.id, {
      ...entity, label: entity.name, x: entity.x * 100, y: entity.y * 100,
      size: selectedId === entity.id ? 16 : trace.nodeIds.includes(entity.id) ? 13 : entity.risk >= 80 ? 12 : 10,
      color: trace.nodeIds.length && !trace.nodeIds.includes(entity.id) ? "#29403b" : riskColor(entity.risk),
      zIndex: selectedId === entity.id || trace.nodeIds.includes(entity.id) ? 2 : 1,
    }));
    transactions.forEach((tx) => graph.addDirectedEdgeWithKey(tx.id, tx.source, tx.target, {
      ...tx, size: trace.edgeIds.includes(tx.id) ? 3.8 : selectedId === tx.id || selectedId === tx.source || selectedId === tx.target ? 2.8 : 1.2,
      color: trace.edgeIds.includes(tx.id) ? "#67e0b6" : trace.edgeIds.length ? "#29403b" : tx.risk >= 80 ? "#ff5b6e" : "#385250", label: tx.display,
    }));
    loadGraph(graph);
  }, [entities, transactions, selectedId, trace, loadGraph]);
  useEffect(() => {
    actionsRef.current = {
      zoomIn: () => sigma.getCamera().animatedZoom({ duration: 180, factor: 1.4 }),
      zoomOut: () => sigma.getCamera().animatedUnzoom({ duration: 180, factor: 1.4 }),
      reset: () => sigma.getCamera().animatedReset({ duration: 260 }),
    };
    return () => { actionsRef.current = null; };
  }, [actionsRef, sigma]);
  useEffect(() => registerEvents({
    clickNode: ({ node }) => onSelect({ type: "entity", value: node }),
    clickEdge: ({ edge }) => onSelect({ type: "transaction", value: edge }),
  }), [registerEvents, onSelect]);
  return null;
}

export default function NetworkCanvas({ entities, transactions, selectedId, trace, onSelect, actionsRef }) {
  return <SigmaContainer className="sigma-stage" settings={{ renderEdgeLabels: false, defaultEdgeType: "arrow", labelRenderedSizeThreshold: 9, labelFont: "IBM Plex Mono", labelColor: { color: "#d2dfda" }, zIndex: true }}>
    <GraphLoader entities={entities} transactions={transactions} selectedId={selectedId} trace={trace} onSelect={onSelect} actionsRef={actionsRef} />
  </SigmaContainer>;
}
