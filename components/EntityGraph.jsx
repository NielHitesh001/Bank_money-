import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { forceCollide, forceRadial, forceX, forceY } from "d3-force";
import GraphSearch from "./GraphSearch";
import GraphControls, { defaultGraphSettings } from "./GraphControls";

const demoNetwork = {
  nodes: [
    { id: "US", name: "United States", type: "country", val: 18, color: "#38bdf8", x: 0, y: 0 },
    { id: "JPM", name: "JPMorgan Chase", type: "major bank", val: 12, color: "#76e2b5", x: 80, y: -60 },
    { id: "BAC", name: "Bank of America", type: "major bank", val: 12, color: "#76e2b5", x: -80, y: -60 },
    { id: "FRB", name: "First Republic", type: "regional bank", val: 7, color: "#eab308", x: 120, y: 80 },
    { id: "SVB", name: "Silicon Valley Bank", type: "regional bank", val: 7, color: "#ee958e", x: -120, y: 80 },
  ],
  links: [
    { source: "US", target: "JPM" }, { source: "US", target: "BAC" },
    { source: "JPM", target: "FRB" }, { source: "BAC", target: "SVB" },
  ],
};

const nodeStyles = {
  country: { color: "#38bdf8", val: 13 },
  "central-bank": { color: "#76e2b5", val: 10 },
  currency: { color: "#eab308", val: 8 },
  "payment-rail": { color: "#f97316", val: 9 },
};

function graphFromExport(payload) {
  if (payload?.schema_version !== "1.0" || !Array.isArray(payload.nodes) || !Array.isArray(payload.links)) {
    throw new Error("Unsupported graph export");
  }
  return {
    nodes: payload.nodes.map((node) => ({
      ...node,
      name: node.label || node.id,
      category: node.type,
      ...(nodeStyles[node.type] || { color: "#dce6e3", val: 6 }),
    })),
    links: payload.links,
  };
}

const expansions = {
  FRB: { id: "TX_901", name: "Wire: $1.2M -> Cayman Trust", type: "ledger transaction", val: 4, color: "#f97316" },
  SVB: { id: "TX_902", name: "Wire: $840K -> Venture Fund", type: "ledger transaction", val: 4, color: "#f97316" },
  JPM: { id: "RBC", name: "Royal Bank of Canada", type: "regional bank", val: 7, color: "#eab308" },
};

export default function EntityGraph() {
  const MAX_NODES = 5000;
  const [graphData, setGraphData] = useState(demoNetwork);
  const [dataStatus, setDataStatus] = useState("demo");
  const [streamStatus, setStreamStatus] = useState("disabled");
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightNodeIds, setHighlightNodeIds] = useState(() => new Set());
  const [highlightLinkIds, setHighlightLinkIds] = useState(() => new Set());
  const [hoveredNode, setHoveredNode] = useState(null);
  const [layoutMode, setLayoutMode] = useState(() => window.localStorage.getItem("world-money-graph-layout") || "force");
  const [graphSettings, setGraphSettings] = useState(defaultGraphSettings);
  const workerRef = useRef(null);
  const graphRef = useRef(null);

  useEffect(() => {
    const exportUrl = import.meta.env.VITE_GRAPH_EXPORT_URL;
    if (!exportUrl) return undefined;
    let cancelled = false;
    setDataStatus("loading");
    fetch(exportUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Export request failed: ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (cancelled) return;
        setGraphData(graphFromExport(payload));
        setDataStatus("live");
        window.setTimeout(() => graphRef.current?.zoomToFit(700, 72), 80);
      })
      .catch(() => !cancelled && setDataStatus("demo"));
    return () => { cancelled = true; };
  }, []);

  const filteredData = useMemo(() => {
    const query = graphSettings.searchQuery.trim().toLowerCase();
    const validNodes = graphData.nodes.filter((node) => {
      const nodeName = (node.name || "").toLowerCase();
      const nodeId = String(node.id).toLowerCase();
      const category = (node.category || node.type || "").toLowerCase();
      if (query && !nodeName.includes(query) && !nodeId.includes(query)) return false;
      if (!graphSettings.showTags && category === "tag") return false;
      if (!graphSettings.showAttachments && category === "attachment") return false;
      if (graphSettings.existingOnly && (node.generated || category.includes("transaction"))) return false;
      if (!graphSettings.showOrphans && !graphData.links.some((link) => (link.source?.id || link.source) === node.id || (link.target?.id || link.target) === node.id)) return false;
      return true;
    });
    const nodeIds = new Set(validNodes.map((node) => node.id));
    return { nodes: validNodes, links: graphData.links.filter((link) => nodeIds.has(link.source?.id || link.source) && nodeIds.has(link.target?.id || link.target)) };
  }, [graphData, graphSettings]);

  const processedLinks = useMemo(() => filteredData.links.map((link) => ({
    ...link,
    source: link.source?.id || link.source,
    target: link.target?.id || link.target,
  })), [filteredData.links]);

  useEffect(() => {
    const streamUrl = import.meta.env.VITE_GRAPH_STREAM_URL;
    if (!streamUrl) return undefined;
    const worker = new Worker(new URL("../streamWorker.js", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event) => {
      const { type, data, payload } = event.data;
      if (type === "STATUS") {
        setStreamStatus(data.toLowerCase());
        return;
      }
      if (type !== "BATCH_UPDATE") return;

      setGraphData((previous) => {
        const nodes = [...previous.nodes];
        const nodeIds = new Set(nodes.map((node) => node.id));
        const links = [...previous.links];
        const linkIds = new Set(links.map((link) => `${link.source?.id || link.source}->${link.target?.id || link.target}`));

        for (const item of payload) {
          if (item.type !== "NEW_NODE" || !item.node?.id || !item.link?.source || !item.link?.target) continue;
          if (!nodeIds.has(item.node.id)) {
            nodes.push(item.node);
            nodeIds.add(item.node.id);
          }
          const linkId = `${item.link.source}->${item.link.target}`;
          if (!linkIds.has(linkId)) {
            links.push(item.link);
            linkIds.add(linkId);
          }
        }

        const cappedNodes = nodes.slice(-MAX_NODES);
        const visibleIds = new Set(cappedNodes.map((node) => node.id));
        return {
          nodes: cappedNodes,
          links: links.filter((link) => visibleIds.has(link.source?.id || link.source) && visibleIds.has(link.target?.id || link.target)),
        };
      });
    };
    worker.postMessage({ action: "CONNECT", url: streamUrl });

    return () => {
      worker.postMessage({ action: "DISCONNECT" });
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const updateHighlights = useCallback((node) => {
    if (!node) {
      setHighlightNodeIds(new Set());
      setHighlightLinkIds(new Set());
      return;
    }
    const nodeIds = new Set([node.id]);
    const linkIds = new Set();
    graphData.links.forEach((link) => {
      const sourceId = link.source?.id || link.source;
      const targetId = link.target?.id || link.target;
      if (sourceId === node.id || targetId === node.id) {
        nodeIds.add(sourceId);
        nodeIds.add(targetId);
        linkIds.add(`${sourceId}->${targetId}`);
      }
    });
    setHighlightNodeIds(nodeIds);
    setHighlightLinkIds(linkIds);
  }, [graphData.links]);

  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node || null);
    updateHighlights(node);
  }, [updateHighlights]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setHighlightedNodeId(node.id);
    updateHighlights(node);
    const expansion = expansions[node.id];
    if (!expansion) return;

    setGraphData((previous) => {
      if (previous.nodes.some((currentNode) => currentNode.id === expansion.id)) return previous;
      return {
        nodes: [...previous.nodes, expansion],
        links: [...previous.links, { source: node.id, target: expansion.id }],
      };
    });
  };

  const handleSelectNode = (node) => {
    setSelectedNode(node);
    setHighlightedNodeId(node.id);
    updateHighlights(node);
    if (graphRef.current && Number.isFinite(node.x) && Number.isFinite(node.y)) {
      graphRef.current.centerAt(node.x, node.y, 600);
    }
  };

  const applyLayoutTransform = (mode, data) => {
    const nodes = data.nodes.map((node) => ({ ...node, fx: undefined, fy: undefined }));
    const links = data.links.map((link) => ({ ...link }));
    if (mode === "force") return { nodes, links };

    const degrees = new Map(nodes.map((node) => [node.id, 0]));
    const incoming = new Map(nodes.map((node) => [node.id, 0]));
    links.forEach((link) => {
      const sourceId = link.source?.id || link.source;
      const targetId = link.target?.id || link.target;
      degrees.set(sourceId, (degrees.get(sourceId) || 0) + 1);
      degrees.set(targetId, (degrees.get(targetId) || 0) + 1);
      incoming.set(targetId, (incoming.get(targetId) || 0) + 1);
    });

    if (mode === "radial") {
      const center = nodes.reduce((best, node) => (degrees.get(node.id) > (degrees.get(best?.id) || -1) ? node : best), nodes[0]);
      if (!center) return { nodes, links };
      const distances = new Map([[center.id, 0]]);
      const queue = [center.id];
      while (queue.length) {
        const currentId = queue.shift();
        links.forEach((link) => {
          const sourceId = link.source?.id || link.source;
          const targetId = link.target?.id || link.target;
          const nextId = sourceId === currentId ? targetId : targetId === currentId ? sourceId : null;
          if (nextId && !distances.has(nextId)) {
            distances.set(nextId, distances.get(currentId) + 1);
            queue.push(nextId);
          }
        });
      }
      const rings = new Map();
      nodes.forEach((node) => {
        const ring = distances.get(node.id) || 1;
        if (!rings.has(ring)) rings.set(ring, []);
        rings.get(ring).push(node);
      });
      rings.forEach((ringNodes, ring) => ringNodes.forEach((node, index) => {
        const angle = (index / ringNodes.length) * Math.PI * 2;
        const radius = ring === 0 ? 0 : 100 + ring * 90;
        node.x = Math.cos(angle) * radius;
        node.y = Math.sin(angle) * radius;
      }));
    }

    if (mode === "hierarchical") {
      const levels = new Map();
      const roots = nodes.filter((node) => !incoming.get(node.id));
      const queue = roots.length ? roots.map((node) => [node.id, 0]) : [[nodes[0]?.id, 0]];
      while (queue.length) {
        const [currentId, level] = queue.shift();
        if (!currentId || levels.has(currentId)) continue;
        levels.set(currentId, level);
        links.forEach((link) => {
          const sourceId = link.source?.id || link.source;
          if (sourceId === currentId) queue.push([link.target?.id || link.target, level + 1]);
        });
      }
      nodes.forEach((node) => {
        const level = levels.get(node.id) || 0;
        const layer = nodes.filter((candidate) => (levels.get(candidate.id) || 0) === level);
        const index = layer.findIndex((candidate) => candidate.id === node.id);
        node.x = (index - (layer.length - 1) / 2) * 125;
        node.y = level * 120 - 120;
      });
    }
    return { nodes, links };
  };

  const handleLayoutChange = (mode) => {
    setLayoutMode(mode);
    window.localStorage.setItem("world-money-graph-layout", mode);
    setGraphData((previous) => applyLayoutTransform(mode, previous));
    window.setTimeout(() => graphRef.current?.zoomToFit(700, 45), 50);
  };

  useEffect(() => {
    if (layoutMode !== "force") {
      setGraphData((previous) => applyLayoutTransform(layoutMode, previous));
    }
  }, []);

  useEffect(() => {
    if (!graphRef.current) return;
    const graph = graphRef.current;
    const categoryOf = (node) => node.category || node.type || "entity";

    if (layoutMode === "radial") {
      graph.d3Force("charge").strength(-120);
      graph.d3Force("link").distance(60);
      graph.d3Force("radial", forceRadial((node) => (node.val || 6) * 8, 0, 0).strength(0.8));
      graph.d3Force("x", null);
      graph.d3Force("y", null);
    } else if (layoutMode === "hierarchical") {
      graph.d3Force("charge").strength(-200);
      graph.d3Force("link").distance(90);
      graph.d3Force("radial", null);
      graph.d3Force("x", forceX((node) => {
        const category = categoryOf(node).toLowerCase();
        if (category.includes("country")) return -300;
        if (category.includes("major")) return -100;
        if (category.includes("regional")) return 100;
        return 280;
      }).strength(0.9));
      graph.d3Force("y", forceY(0).strength(0.1));
    } else {
      graph.d3Force("charge").strength(-80);
      graph.d3Force("link").distance(50);
      graph.d3Force("radial", null);
      graph.d3Force("x", null);
      graph.d3Force("y", null);
    }
    graph.d3ReheatSimulation();
  }, [layoutMode]);

  useEffect(() => {
    if (!graphRef.current) return;
    const graph = graphRef.current;
    graph.d3Force("collide", forceCollide(() => graphSettings.nodeSize + 8).strength(0.95).iterations(2));
    graph.d3Force("charge").strength(-graphSettings.repelForce);
    graph.d3Force("link").distance(graphSettings.linkDistance);
    graph.d3Force("center").strength(graphSettings.centerForce);
    graph.d3ReheatSimulation();
  }, [graphSettings.repelForce, graphSettings.linkDistance, graphSettings.centerForce, graphSettings.nodeSize]);

  const handleAnimate = () => {
    graphRef.current?.d3ReheatSimulation();
    graphRef.current?.zoomToFit(900, 35);
  };

  return <section className="entity-graph-panel entity-graph-container">
    <div className="graph-toolbar"><div><span className="eyebrow">NETWORK DISCOVERY ENGINE</span><h2>Entity network</h2></div><span className={`graph-live ${dataStatus}`}><span className="status-dot" />DATA: {dataStatus.toUpperCase()}</span></div>
    <div className="graph-stage"><GraphSearch nodes={graphData.nodes} onSelectNode={handleSelectNode} /><GraphControls settings={graphSettings} onChange={setGraphSettings} onAnimate={handleAnimate} /><div className="layout-switcher" role="group" aria-label="Graph layout mode">{[["force", "Force"], ["radial", "Radial"], ["hierarchical", "Hierarchy"]].map(([mode, label]) => <button key={mode} type="button" className={layoutMode === mode ? "active" : ""} onClick={() => handleLayoutChange(mode)}>{label}</button>)}</div>{selectedNode && <aside className="node-inspector"><div className="inspector-heading"><span className="node-id">[{selectedNode.id}] INSPECTOR</span><button type="button" aria-label="Close inspector" onClick={() => setSelectedNode(null)}>x</button></div><div className="inspector-field"><span>NAME</span><strong>{selectedNode.name}</strong></div><div className="inspector-field"><span>TYPE</span><strong>{selectedNode.category || selectedNode.type || "ENTITY"}</strong></div><div className="inspector-field"><span>RISK PROFILE</span><strong className={`risk-${(selectedNode.risk || "normal").toLowerCase()}`}>{selectedNode.risk || "NORMAL"}</strong></div><div className="inspector-field"><span>LAYOUT</span><strong>{layoutMode.toUpperCase()}</strong></div><div className="inspector-log"><span>TRANSACTION LOG</span><p>Relations: {graphData.links.filter((link) => (link.source?.id || link.source) === selectedNode.id || (link.target?.id || link.target) === selectedNode.id).length}</p><p>Stream state: {streamStatus.toUpperCase()}</p></div></aside>}{hoveredNode && !selectedNode && <div className="node-tooltip"><div><span className="node-id">[{hoveredNode.id}]</span> {hoveredNode.name}</div><div className="node-meta">CATEGORY: {hoveredNode.category || hoveredNode.type || "ENTITY"} | RISK: {hoveredNode.risk || "NORMAL"}</div></div>}<ForceGraph2D ref={graphRef} graphData={{ nodes: filteredData.nodes, links: processedLinks }} cooldownTicks={layoutMode === "force" ? 100 : 180} d3AlphaDecay={0.05} d3VelocityDecay={0.4} linkColor={(link) => highlightLinkIds.has(`${link.source?.id || link.source}->${link.target?.id || link.target}`) ? "#38bdf8" : "#1e293b"} linkWidth={(link) => highlightLinkIds.has(`${link.source?.id || link.source}->${link.target?.id || link.target}`) ? graphSettings.linkThickness * 2 : graphSettings.linkThickness} linkDirectionalParticles={2} linkDirectionalParticleSpeed={0.004} linkDirectionalParticleWidth={2} linkDirectionalArrowLength={graphSettings.arrows ? 6 : 0} linkDirectionalArrowRelPos={0.9} linkDirectionalArrowColor={(link) => highlightLinkIds.has(`${link.source?.id || link.source}->${link.target?.id || link.target}`) ? "#38bdf8" : "#334155"} onNodeClick={handleNodeClick} onNodeHover={handleNodeHover} backgroundColor="#050505" nodeRelSize={graphSettings.nodeSize} nodeCanvasObject={(node, context, globalScale) => {
      const radius = Math.max(3.5, (node.val || 5) / 2);
      const fontSize = Math.max(7, 11 / globalScale);
      const isHighlighted = highlightNodeIds.size === 0 || highlightNodeIds.has(node.id);
      context.globalAlpha = isHighlighted ? 1 : 0.18;
      if (node.id === highlightedNodeId || node.id === selectedNode?.id) {
        context.beginPath();
        context.arc(node.x, node.y, radius + 5, 0, 2 * Math.PI);
        context.strokeStyle = "#f4d35e";
        context.lineWidth = 2 / globalScale;
        context.stroke();
      }
      context.fillStyle = node.color || "#dce6e3";
      context.beginPath();
      context.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      context.fill();
      context.strokeStyle = "#07100f";
      context.lineWidth = 1.5 / globalScale;
      context.stroke();
      context.fillStyle = "#b8cbc4";
      if (globalScale > 3.2 || node.id === selectedNode?.id || node.id === hoveredNode?.id) {
        context.font = `${fontSize}px DM Mono, monospace`;
        context.fillText(node.name, node.x + radius + 4, node.y + 3);
      }
      context.globalAlpha = 1;
    }} /></div>
    <div className="graph-footer"><span><i className="legend-dot country" />Country</span><span><i className="legend-dot major" />Central bank</span><span><i className="legend-dot regional" />Currency</span><span><i className="legend-dot transaction" />Payment rail</span><span className="graph-hint">Select a node to inspect</span></div>
  </section>;
}
