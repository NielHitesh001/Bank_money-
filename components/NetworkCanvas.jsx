import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { forceCollide, forceLink, forceManyBody } from "d3-force";

const riskColor = (risk) => (risk >= 80 ? "#ff5b6e" : risk >= 55 ? "#f3ae52" : "#52d6aa");

export default function NetworkCanvas({ entities, transactions, selectedId, trace, onSelect, actionsRef }) {
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Responsive container sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 800,
          height: clientHeight || 600,
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Format data for ForceGraph2D
  const graphData = useMemo(() => {
    const nodes = entities.map((e) => ({
      id: e.id,
      name: e.name,
      country: e.country,
      kind: e.kind,
      risk: e.risk,
      volume: e.volume,
      // Map initial coordinates
      fx: Number.isFinite(e.x) ? e.x * 220 : undefined,
      fy: Number.isFinite(e.y) ? e.y * 220 : undefined,
    }));

    const entityIds = new Set(nodes.map((n) => n.id));
    const links = transactions
      .filter((tx) => entityIds.has(tx.source) && entityIds.has(tx.target))
      .map((tx) => ({
        id: tx.id,
        source: tx.source,
        target: tx.target,
        amount: tx.amount,
        currency: tx.currency,
        display: tx.display,
        rail: tx.rail,
        risk: tx.risk,
        flag: tx.flag,
      }));

    return { nodes, links };
  }, [entities, transactions]);

  // Initial fit
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      const timer = setTimeout(() => {
        fgRef.current?.zoomToFit(400, 60);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [graphData]);

  // Expose zoom controls
  useEffect(() => {
    actionsRef.current = {
      zoomIn: () => {
        const fg = fgRef.current;
        if (fg) fg.zoom(fg.zoom() * 1.3, 200);
      },
      zoomOut: () => {
        const fg = fgRef.current;
        if (fg) fg.zoom(fg.zoom() / 1.3, 200);
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

      const baseR = isSelected ? 12 : isTraced ? 10 : node.risk >= 80 ? 9 : 7;
      const color = isDimmed ? "#1c2b27" : riskColor(node.risk);

      // Outer glow for critical or selected nodes
      if (isSelected || (node.risk >= 80 && !isDimmed)) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, baseR + 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = isSelected ? "rgba(100, 220, 177, 0.25)" : "rgba(255, 91, 110, 0.22)";
        ctx.fill();
      }

      // Main node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseR, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.fill();

      // Border ring
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.strokeStyle = isSelected ? "#ffffff" : isDimmed ? "#141e1b" : "#0c1211";
      ctx.stroke();

      // Label rendering
      if (globalScale > 0.6 || isSelected || isTraced || node.risk >= 80) {
        const label = node.id;
        const fontSize = Math.max(10 / globalScale, 9);
        ctx.font = `600 ${fontSize}px "DM Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        // Label shadow/background for contrast
        const textY = node.y + baseR + 4;
        ctx.fillStyle = isDimmed ? "#40544f" : isSelected ? "#64dcb1" : "#e0eae6";
        ctx.fillText(label, node.x, textY);

        // Subtitle (Name)
        if (globalScale > 1.2) {
          const subFontSize = Math.max(8 / globalScale, 7);
          ctx.font = `400 ${subFontSize}px "DM Mono", monospace`;
          ctx.fillStyle = isDimmed ? "#2d3e3a" : "#7e9790";
          ctx.fillText(node.name.length > 20 ? `${node.name.slice(0, 18)}...` : node.name, node.x, textY + fontSize + 2);
        }
      }
    },
    [selectedId, trace]
  );

  return (
    <div ref={containerRef} className="sigma-stage" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
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
          return link.risk >= 80 ? "rgba(255, 91, 110, 0.6)" : "rgba(60, 95, 85, 0.4)";
        }}
        linkWidth={(link) => {
          if (trace.edgeIds.includes(link.id)) return 3.5;
          if (selectedId === link.id) return 2.8;
          return 1.4;
        }}
        linkDirectionalParticles={(link) => (trace.edgeIds.includes(link.id) ? 4 : link.risk >= 80 ? 2 : 0)}
        linkDirectionalParticleSpeed={(link) => (trace.edgeIds.includes(link.id) ? 0.008 : 0.004)}
        linkDirectionalParticleWidth={(link) => (trace.edgeIds.includes(link.id) ? 3.5 : 2)}
        linkDirectionalParticleColor={(link) => (trace.edgeIds.includes(link.id) ? "#64dcb1" : "#ff5b6e")}
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
        onNodeClick={(node) => onSelect({ type: "entity", value: node.id })}
        onLinkClick={(link) => onSelect({ type: "transaction", value: link.id })}
      />
    </div>
  );
}
