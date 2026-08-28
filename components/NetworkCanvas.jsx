import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

const riskColor = (risk) => {
  if (risk >= 80) return "#ff5b6e"; // Critical (Red)
  if (risk >= 55) return "#f3ae52"; // Elevated (Amber)
  return "#52d6aa"; // Standard (Green)
};

const kindIcon = (kind) => {
  if (kind === "Central Bank") return "🏛";
  if (kind === "Tier 1 Bank") return "🏦";
  if (kind === "Corporate Endpoint") return "🏢";
  return "⚡";
};

export default function NetworkCanvas({
  entities = [],
  transactions = [],
  selectedId,
  trace = { nodeIds: [], edgeIds: [] },
  onSelect,
  actionsRef,
}) {
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredItem, setHoveredItem] = useState(null);

  // ResizeObserver for responsive canvas sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 800,
          height: containerRef.current.clientHeight || 600,
        });
      }
    };
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Format graph data for react-force-graph-2d
  const graphData = useMemo(() => {
    const nodeMap = new Map();
    const nodes = entities.map((e) => {
      const node = {
        id: e.id,
        name: e.name,
        kind: e.kind,
        country: e.country,
        flag: e.flag || "",
        risk: e.risk || 0,
        volume: e.volume || "$0",
        aml: e.aml || {},
        val: e.kind === "Central Bank" ? 14 : e.kind === "Tier 1 Bank" ? 10 : 7,
      };
      nodeMap.set(e.id, node);
      return node;
    });

    const links = transactions
      .filter((t) => nodeMap.has(t.source) && nodeMap.has(t.target))
      .map((t) => ({
        id: t.id,
        source: t.source,
        target: t.target,
        amount: t.amount,
        display: t.display,
        currency: t.currency,
        rail: t.rail,
        risk: t.risk || 0,
        flag: t.flag,
        uetr: t.uetr,
        date: t.date,
      }));

    return { nodes, links };
  }, [entities, transactions]);

  // Initial camera zoom to fit
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      const timer = setTimeout(() => {
        fgRef.current?.zoomToFit(600, 60);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [graphData.nodes.length]);

  // Expose graph actions (zoom, reset)
  useEffect(() => {
    if (!actionsRef) return;
    actionsRef.current = {
      zoomIn: () => {
        const fg = fgRef.current;
        if (fg) fg.zoom(fg.zoom() * 1.35, 250);
      },
      zoomOut: () => {
        const fg = fgRef.current;
        if (fg) fg.zoom(fg.zoom() / 1.35, 250);
      },
      reset: () => {
        const fg = fgRef.current;
        if (fg) fg.zoomToFit(400, 60);
      },
    };
    return () => {
      actionsRef.current = null;
    };
  }, [actionsRef]);

  // Custom node canvas rendering
  const drawNode = useCallback(
    (node, ctx, globalScale) => {
      const isSelected = selectedId === node.id;
      const isTraced = trace.nodeIds.includes(node.id);
      const isDimmed = trace.nodeIds.length > 0 && !isTraced;

      const baseR = isSelected ? 13 : isTraced ? 11 : node.risk >= 80 ? 10 : node.kind === "Central Bank" ? 9 : 7.5;
      const color = isDimmed ? "#162320" : riskColor(node.risk);

      // Multi-layer outer glow for critical, selected, or traced nodes
      if (isSelected || isTraced || (node.risk >= 80 && !isDimmed)) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, baseR + 6, 0, 2 * Math.PI, false);
        ctx.fillStyle = isSelected
          ? "rgba(100, 220, 177, 0.3)"
          : isTraced
          ? "rgba(56, 189, 248, 0.25)"
          : "rgba(255, 91, 110, 0.25)";
        ctx.fill();
      }

      // Main node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseR, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.fill();

      // Border ring
      ctx.lineWidth = isSelected ? 2.5 : isTraced ? 2 : 1.5;
      ctx.strokeStyle = isSelected ? "#ffffff" : isTraced ? "#38bdf8" : isDimmed ? "#121b18" : "#080e0c";
      ctx.stroke();

      // Inner Icon (🏛 / 🏦 / 🏢)
      if (globalScale > 0.8) {
        const icon = kindIcon(node.kind);
        const iconSize = Math.max(8 / globalScale, 8);
        ctx.font = `${iconSize}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icon, node.x, node.y);
      }

      // Label rendering
      if (globalScale > 0.5 || isSelected || isTraced || node.risk >= 80) {
        const label = `${node.flag ? node.flag + " " : ""}${node.id}`;
        const fontSize = Math.max(10 / globalScale, 9);
        ctx.font = `600 ${fontSize}px "DM Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const textY = node.y + baseR + 5;
        ctx.fillStyle = isDimmed ? "#3b4d48" : isSelected ? "#64dcb1" : isTraced ? "#38bdf8" : "#e0eae6";
        ctx.fillText(label, node.x, textY);

        // Subtitle (Institution Name)
        if (globalScale > 1.1) {
          const subFontSize = Math.max(8 / globalScale, 7.5);
          ctx.font = `400 ${subFontSize}px "DM Mono", monospace`;
          ctx.fillStyle = isDimmed ? "#263531" : "#7e9790";
          const trunc = node.name.length > 22 ? `${node.name.slice(0, 20)}...` : node.name;
          ctx.fillText(trunc, node.x, textY + fontSize + 2);
        }
      }
    },
    [selectedId, trace]
  );

  return (
    <div ref={containerRef} className="sigma-stage" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      {hoveredItem && (
        <div className="canvas-hover-card">
          {hoveredItem.type === "node" ? (
            <>
              <div className="hover-head">
                <span className="hover-flag">{hoveredItem.data.flag}</span>
                <strong>{hoveredItem.data.name}</strong>
                <span className="hover-badge">[{hoveredItem.data.id}]</span>
              </div>
              <div className="hover-meta">
                <span>{hoveredItem.data.kind} · {hoveredItem.data.country}</span>
                <span className="hover-risk" style={{ color: riskColor(hoveredItem.data.risk) }}>
                  Risk: {hoveredItem.data.risk}/100
                </span>
              </div>
              <div className="hover-foot">24H Exposure: <b>{hoveredItem.data.volume}</b></div>
            </>
          ) : (
            <>
              <div className="hover-head">
                <strong>{hoveredItem.data.display} ({hoveredItem.data.currency})</strong>
                <span className="hover-badge">{hoveredItem.data.rail}</span>
              </div>
              <div className="hover-meta">
                <span>{hoveredItem.data.source?.id || hoveredItem.data.source} → {hoveredItem.data.target?.id || hoveredItem.data.target}</span>
                <span className="hover-risk" style={{ color: riskColor(hoveredItem.data.risk) }}>
                  Risk: {hoveredItem.data.risk}/100
                </span>
              </div>
              {hoveredItem.data.flag && <div className="hover-flag-warning">⚠ {hoveredItem.data.flag}</div>}
            </>
          )}
        </div>
      )}

      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="#000000"
        nodeRelSize={7}
        nodeCanvasObject={drawNode}
        nodeCanvasObjectMode={() => "replace"}
        linkColor={(link) => {
          const isTraced = trace.edgeIds.includes(link.id);
          const isSelected = selectedId === link.id || selectedId === link.source?.id || selectedId === link.target?.id;
          if (isTraced) return "#64dcb1";
          if (trace.edgeIds.length > 0) return "#15221e";
          if (isSelected) return "#38bdf8";
          return link.risk >= 80 ? "rgba(255, 91, 110, 0.7)" : link.risk >= 55 ? "rgba(243, 174, 82, 0.55)" : "rgba(82, 214, 170, 0.35)";
        }}
        linkWidth={(link) => {
          if (trace.edgeIds.includes(link.id)) return 3.8;
          if (selectedId === link.id) return 3.0;
          return link.risk >= 80 ? 2.2 : 1.5;
        }}
        linkDirectionalParticles={(link) => (trace.edgeIds.includes(link.id) ? 4 : link.risk >= 80 ? 3 : 1)}
        linkDirectionalParticleSpeed={(link) => (trace.edgeIds.includes(link.id) ? 0.008 : link.risk >= 80 ? 0.005 : 0.003)}
        linkDirectionalParticleWidth={(link) => (trace.edgeIds.includes(link.id) ? 3.5 : 2)}
        linkDirectionalParticleColor={(link) => (trace.edgeIds.includes(link.id) ? "#64dcb1" : link.risk >= 80 ? "#ff5b6e" : "#52d6aa")}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={0.9}
        cooldownTicks={120}
        d3AlphaDecay={0.06}
        d3VelocityDecay={0.65}
        onNodeDragEnd={(node) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 16, 0, 2 * Math.PI);
          ctx.fill();
        }}
        onNodeHover={(node) => setHoveredItem(node ? { type: "node", data: node } : null)}
        onLinkHover={(link) => setHoveredItem(link ? { type: "link", data: link } : null)}
        onNodeClick={(node) => onSelect({ type: "entity", value: node.id })}
        onLinkClick={(link) => onSelect({ type: "transaction", value: link.id })}
      />
    </div>
  );
}
