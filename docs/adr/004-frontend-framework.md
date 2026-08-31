# ADR 004: Frontend Framework Choice (React 18 + Vite)

## Status: Accepted

## Context
The terminal UI requires high-density sub-second data streaming, interactive SVG financial charts, real-time node-link graph visualization of AML networks, and seamless tab switching across quantitative IDE desks.

## Decision
We chose React 18 with Vite and Rolldown/ESBuild:
- **Instant HMR & Sub-second Builds**: <300ms production builds with tree-shaking.
- **Concurrent React 18 Primitives**: `useDeferredValue` and `useMemo` for non-blocking UI rendering during search queries across 5,000+ financial transactions.
- **Lightweight SVG & Canvas Rendering**: Zero heavy third-party charting bloat; custom responsive SVG equity curves and candlestick visualizers.

## Consequences
- **Positive**: Exceptional responsiveness, high UI rendering FPS, modular component architecture.
- **Negative**: Requires careful dependency memoization to prevent unbounded re-renders in large datasets.
