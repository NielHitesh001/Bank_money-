# World Money Terminal OS — Documentation Index

Welcome to the **World Money Bloomberg-Scale Terminal OS** documentation. This suite details the real-time data ingestion pipelines, quantitative analytics models, trading order execution workflows, and UI architecture.

---

## 📚 Documentation Suite

| Document | Purpose | Read Time |
|---|---|---|
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | Subsystem boundaries, real-time tick streaming, component hierarchy, and data flows | 10 mins |
| [**DATA_CONTRACT.md**](./DATA_CONTRACT.md) | Standardized JSON schemas for market ticks, order tickets, portfolio positions, and PnL attribution | 8 mins |
| [**SETUP.md**](./SETUP.md) | Local environment setup, dev server lifecycle, test execution, and API key configuration | 5 mins |
| [**PERFORMANCE.md**](./PERFORMANCE.md) | Latency budgets (<300ms ticks), rendering benchmarks, memory profiles, and optimization strategies | 6 mins |
| [**LIVE_DATA_INTEGRATION.md**](./LIVE_DATA_INTEGRATION.md) | Transitioning from local simulation to live Polygon.io / Twelve Data feeds & circuit breakers | 6 mins |
| [**ARCHITECTURAL_DECISIONS.md**](./ARCHITECTURAL_DECISIONS.md) | Formal ADR records (AD-001 through AD-004) detailing key architectural trade-offs | 5 mins |

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run unit & regression test suite (17/17 tests passing)
npm test

# 3. Start local development servers (Vite Frontend + Backend API)
npm run dev      # http://localhost:5173
npm run server   # http://127.0.0.1:8766

# 4. Build optimized production bundle (528 KB gzipped)
npm run build
```

---

## 🎯 Keyboard Shortcuts & Navigation
- **`Cmd + K`** or **`Ctrl + K`**: Open the **Bloomberg Function Command Palette** (`ALLQ`, `OMST`, `BLOT`, `WIRP`, `FXFA`, `VAR`, `AML`, `CORP`, `NEWS`).
- **`Esc`**: Dismiss overlay modals.
