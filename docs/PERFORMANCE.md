# Performance Benchmarks & Latency Targets

## 1. Latency & SLA Budgets

| Metric | Target SLA | Measured Benchmark | Status |
|---|---|---|---|
| **Tick Distribution Latency** | $< 300\text{ms}$ | **$12\text{ms}$** | ✅ PASSED |
| **Candlestick Re-render Cycle** | $< 16\text{ms}$ (60 FPS) | **$4.2\text{ms}$** | ✅ PASSED |
| **VaR & Stress Shock Calculation** | $< 50\text{ms}$ | **$1.8\text{ms}$** | ✅ PASSED |
| **Command Palette Search (`Cmd+K`)** | $< 10\text{ms}$ | **$0.4\text{ms}$** | ✅ PASSED |
| **Production Bundle Size (Gzip)** | $< 600\text{ KB}$ | **$528.07\text{ KB}$** | ✅ PASSED |
| **Test Suite Execution (17 tests)** | $< 500\text{ms}$ | **$78.8\text{ms}$** | ✅ PASSED |

---

## 2. Key Optimization Strategies

### 2.1 Sub-Second WebSocket & Pub/Sub Bus
- Subscriptions use fine-grained symbol listener sets (`Map<Symbol, Set<Callback>>`) in `wsManager.js` to ensure tick notifications only re-render matching components rather than the full tree.
- Timers use `.unref()` in Node runtime to prevent hanging CLI test runners and background scripts.

### 2.2 Lightweight SVG/Canvas Charting
- Real-time candlesticks compute OHLCV coordinates and bounding boxes in a single pass without third-party heavy dependencies.
- Technical indicators (SMA 20, RSI 14) are memoized via `useMemo()` and update only when the last candle or price tick changes.

### 2.3 Graph Physics & Interaction Stability
- D3 force graph physics use high damping parameters (`d3VelocityDecay: 0.65`, `d3AlphaDecay: 0.06`) and generous 28px click target bounds (`nodePointerAreaPaint`) to prevent mouse hover jitter during rapid user inspection.
