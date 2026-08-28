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
    { source: "US", target: "JPM" },
    { source: "US", target: "BAC" },
    { source: "JPM", target: "FRB" },
    { source: "BAC", target: "SVB" },
  ],
};

const nodeStyles = {
  country: { color: "#38bdf8", val: 13 },
  "central-bank": { color: "#76e2b5", val: 11 },
  currency: { color: "#eab308", val: 9 },
  "payment-rail": { color: "#f97316", val: 10 },
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
      ...(nodeStyles[node.type] || { color: "#dce6e3", val: 7 }),
    })),
    links: payload.links,
  };
}

export default function EntityGraph() {
  const [graphData, setGraphData] = useState(demoNetwork);
  const [dataStatus, setDataStatus] = useState("loading");
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightNodeIds, setHighlightNodeIds] = useState(() => new Set());
  const [highlightLinkIds, setHighlightLinkIds] = useState(() => new Set());
  const [hoveredNode, setHoveredNode] = useState(null);
  const [layoutMode, setLayoutMode] = useState("force");
  const [graphSettings, setGraphSettings] = useState(defaultGraphSettings);
  const [dimensions, setDimensions] = useState({ width: 900, height: 620 });

  const stageRef = useRef(null);
  const graphRef = useRef(null);

  // ResizeObserver for responsive canvas sizing
  useEffect(() => {
    if (!stageRef.current) return;
    const updateSize = () => {
      if (stageRef.current) {
        setDimensions({
          width: stageRef.current.clientWidth || 900,
          height: stageRef.current.clientHeight || 620,
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch graph from API server or fallback
  useEffect(() => {
    const exportUrl = import.meta.env.VITE_GRAPH_EXPORT_URL || "http://127.0.0.1:8766/api/graph";
    let cancelled = false;

    fetch(exportUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Export request failed: ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (cancelled) return;
        const parsed = graphFromExport(payload);
        setGraphData(parsed);
        setDataStatus("live");
        setTimeout(() => graphRef.current?.zoomToFit(600, 50), 200);
      })
      .catch(() => {
        if (!cancelled) {
          setDataStatus("demo");
          setTimeout(() => graphRef.current?.zoomToFit(400, 50), 100);
        }
      });

    return () => {
      cancelled = true;
    };
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
      if (
        !graphSettings.showOrphans &&
        !graphData.links.some(
          (link) => (link.source?.id || link.source) === node.id || (link.target?.id || link.target) === node.id
        )
      ) {
        return false;
      }
      return true;
    });
    const nodeIds = new Set(validNodes.map((node) => node.id));
    return {
      nodes: validNodes,
      links: graphData.links.filter(
        (link) =>
          nodeIds.has(link.source?.id || link.source) && nodeIds.has(link.target?.id || link.target)
      ),
    };
  }, [graphData, graphSettings]);

  const processedLinks = useMemo(
    () =>
      filteredData.links.map((link) => ({
        ...link,
        source: link.source?.id || link.source,
        target: link.target?.id || link.target,
      })),
    [filteredData.links]
  );

  const updateHighlights = useCallback(
    (node) => {
      if (!node) {
        setHighlightNodeIds(new Set());
        setHighlightLinkIds(new Set());
        return;
      }
      const neighborNodes = new Set([node.id]);
      const neighborLinks = new Set();
      graphData.links.forEach((link) => {
        const s = link.source?.id || link.source;
        const t = link.target?.id || link.target;
        if (s === node.id) {
          neighborNodes.add(t);
          neighborLinks.add(`${s}->${t}`);
        } else if (t === node.id) {
          neighborNodes.add(s);
          neighborLinks.add(`${s}->${t}`);
        }
      });
      setHighlightNodeIds(neighborNodes);
      setHighlightLinkIds(neighborLinks);
    },
    [graphData.links]
  );

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setHighlightedNodeId(node.id);
    updateHighlights(node);
  };

  const handleNodeHover = (node) => {
    setHoveredNode(node);
    if (!selectedNode) updateHighlights(node);
  };

  const handleSelectNode = (node) => {
    setSelectedNode(node);
    setHighlightedNodeId(node.id);
    updateHighlights(node);
    if (graphRef.current && Number.isFinite(node.x) && Number.isFinite(node.y)) {
      graphRef.current.centerAt(node.x, node.y, 600);
      graphRef.current.zoom(2.5, 600);
    }
  };

  const handleLayoutChange = (mode) => {
    setLayoutMode(mode);
    if (!graphRef.current) return;
    const graph = graphRef.current;

    if (mode === "radial") {
      graph.d3Force("charge").strength(-160);
      graph.d3Force("link").distance(70);
      graph.d3Force("radial", forceRadial((node) => (node.val || 6) * 12, 0, 0).strength(0.8));
    } else if (mode === "hierarchical") {
      graph.d3Force("charge").strength(-220);
      graph.d3Force("link").distance(100);
      graph.d3Force("radial", null);
      graph.d3Force("x", forceX((node) => {
        const cat = (node.category || node.type || "").toLowerCase();
        if (cat.includes("country")) return -320;
        if (cat.includes("central")) return -100;
        if (cat.includes("currency")) return 120;
        return 300;
      }).strength(0.9));
      graph.d3Force("y", forceY(0).strength(0.1));
    } else {
      graph.d3Force("charge").strength(-140);
      graph.d3Force("link").distance(80);
      graph.d3Force("radial", null);
      graph.d3Force("x", null);
      graph.d3Force("y", null);
    }
    graph.d3ReheatSimulation();
    setTimeout(() => graph.zoomToFit(600, 45), 100);
  };

  useEffect(() => {
    if (!graphRef.current) return;
    const graph = graphRef.current;
    graph.d3Force("collide", forceCollide(() => graphSettings.nodeSize + 6).strength(0.9).iterations(2));
    graph.d3Force("charge").strength(-graphSettings.repelForce);
    graph.d3Force("link").distance(graphSettings.linkDistance);
    graph.d3Force("center").strength(graphSettings.centerForce);
    graph.d3ReheatSimulation();
  }, [graphSettings.repelForce, graphSettings.linkDistance, graphSettings.centerForce, graphSettings.nodeSize]);

  const handleAnimate = () => {
    graphRef.current?.d3ReheatSimulation();
    graphRef.current?.zoomToFit(800, 40);
  };

  return (
    <section className="dashboard-panel entity-graph-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">OBSIDIAN VAULT KNOWLEDGE GRAPH</span>
          <h2>Global Financial Architecture Network ({filteredData.nodes.length} Nodes · {filteredData.links.length} Relations)</h2>
        </div>
        <div className="graph-live-badge">
          <span className={`status-dot ${dataStatus === "live" ? "live" : "demo"}`} />
          {dataStatus === "live" ? "CANONICAL VAULT EXPORT (LIVE)" : "DEMO KNOWLEDGE SEED"}
        </div>
      </div>

      <div ref={stageRef} className="graph-stage-container">
        <div className="graph-floating-controls">
          <GraphSearch nodes={graphData.nodes} onSelectNode={handleSelectNode} />
          <GraphControls settings={graphSettings} onChange={setGraphSettings} onAnimate={handleAnimate} />
          <div className="layout-switcher">
            {[
              ["force", "Force Layout"],
              ["radial", "Radial Hierarchy"],
              ["hierarchical", "Tiered Flows"],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                className={layoutMode === mode ? "active" : ""}
                onClick={() => handleLayoutChange(mode)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {selectedNode && (
          <aside className="node-inspector-card">
            <div className="inspector-heading">
              <span className="node-id">[{selectedNode.id}]</span>
              <button type="button" onClick={() => setSelectedNode(null)}>
                ×
              </button>
            </div>
            <div className="inspector-field">
              <span>NAME</span>
              <strong>{selectedNode.name}</strong>
            </div>
            <div className="inspector-field">
              <span>CATEGORY</span>
              <span className="kind-tag" style={{ background: selectedNode.color, color: "#000", fontWeight: "700" }}>
                {selectedNode.category || selectedNode.type}
              </span>
            </div>
            <div className="inspector-field">
              <span>CONNECTED RELATIONS</span>
              <strong>
                {
                  graphData.links.filter(
                    (l) => (l.source?.id || l.source) === selectedNode.id || (l.target?.id || l.target) === selectedNode.id
                  ).length
                }{" "}
                corridors
              </strong>
            </div>
          </aside>
        )}

        {hoveredNode && !selectedNode && (
          <div className="node-floating-tooltip">
            <strong>{hoveredNode.name}</strong> <small>({hoveredNode.id})</small>
            <div className="tooltip-sub">TYPE: {hoveredNode.category || hoveredNode.type}</div>
          </div>
        )}

        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={{ nodes: filteredData.nodes, links: processedLinks }}
          backgroundColor="#020202"
          nodeRelSize={graphSettings.nodeSize}
          linkColor={(link) =>
            highlightLinkIds.has(`${link.source?.id || link.source}->${link.target?.id || link.target}`)
              ? "#64dcb1"
              : "#1a2624"
          }
          linkWidth={(link) =>
            highlightLinkIds.has(`${link.source?.id || link.source}->${link.target?.id || link.target}`)
              ? graphSettings.linkThickness * 2.2
              : graphSettings.linkThickness
          }
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={0.003}
          linkDirectionalParticleWidth={2}
          linkDirectionalArrowLength={graphSettings.arrows ? 5 : 0}
          linkDirectionalArrowRelPos={0.9}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          nodeCanvasObject={(node, context, globalScale) => {
            const radius = Math.max(4, (node.val || 6) / 2);
            const isHighlighted = highlightNodeIds.size === 0 || highlightNodeIds.has(node.id);
            context.globalAlpha = isHighlighted ? 1 : 0.2;

            if (node.id === highlightedNodeId || node.id === selectedNode?.id) {
              context.beginPath();
              context.arc(node.x, node.y, radius + 5, 0, 2 * Math.PI);
              context.strokeStyle = "#64dcb1";
              context.lineWidth = 2.5 / globalScale;
              context.stroke();
            }

            context.fillStyle = node.color || "#dce6e3";
            context.beginPath();
            context.arc(node.x, node.y, radius, 0, 2 * Math.PI);
            context.fill();

            if (globalScale > 1.4 || node.id === selectedNode?.id || node.id === hoveredNode?.id) {
              const fontSize = Math.max(8, 11 / globalScale);
              context.font = `600 ${fontSize}px "DM Mono", monospace`;
              context.fillStyle = isHighlighted ? "#f0fdf4" : "#647771";
              context.fillText(node.name, node.x + radius + 4, node.y + 3);
            }
            context.globalAlpha = 1;
          }}
        />
      </div>

      <div className="graph-footer-legend">
        <span><i className="legend-dot" style={{ background: "#38bdf8" }} /> Sovereign Country</span>
        <span><i className="legend-dot" style={{ background: "#76e2b5" }} /> Central Bank</span>
        <span><i className="legend-dot" style={{ background: "#eab308" }} /> Currency Hub</span>
        <span><i className="legend-dot" style={{ background: "#f97316" }} /> Payment Rail</span>
        <span className="graph-hint">Drag nodes to explore · Scroll to zoom · Click to inspect relations</span>
      </div>
    </section>
  );
}
