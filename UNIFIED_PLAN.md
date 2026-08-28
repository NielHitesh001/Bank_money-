# World Money — Unified Plan

## Product decision

World Money is a **global liquidity map**: an Obsidian-first knowledge graph
that traces financial infrastructure from sovereigns and central banks through
currencies and payment rails. It is generated and kept current by the Python
daemon. The primary user outcome is an explorable, internally linked vault;
the long-term outcome is a single-screen visual dashboard over that same data.

## Source of truth

- `obsidian_finance_daemon.py` is the production data and generation service.
- Generated vault content is the current product artifact. The daemon preserves
  all content below `## 📝 Notes`.
- `README.md`, `requirements.txt`, `validate_vault.py`, tests, and CI define
  the supported operating path.
- The checked-in `.obsidian/` configuration provides the default graph-view
  experience for a generated vault.

## Supporting prototypes

- The Vite React app is an experimental dashboard shell. Its entity graph can
  consume the local WebSocket stream, but it is not yet backed by generated
  vault data.
- `main.cpp` and the `moneytrace` binary are a local mock-stream prototype for
  that shell, not a production backend.
- `route.ts` is a Next.js API prototype and is inactive in the Vite runtime.
- `Claude.md.md` is a historical prompt fragment, not project requirements.

## Delivery sequence

1. **Operational baseline — complete**
   - Declare Python dependencies and provide the documented vault validator.
   - Keep unit tests, one-shot generation, vault validation, and dashboard
     production build passing.
2. **Canonical data contract — complete**
   - Define a versioned JSON export from the daemon for countries, central
     banks, currencies, rails, and their links.
   - Include source, timestamp, freshness, and data-quality fields.
   - Export atomically to `_system/exports/world-money-graph.v1.json`.
3. **Dashboard integration — in progress**
   - The entity graph now loads the JSON export through a configurable URL;
     unavailable data is visibly labeled as demo data.
   - Replace the remaining ticker-specific panels with contract-backed views,
     then use the WebSocket only for incremental updates.
   - Move or rewrite the inactive Next route only when the dashboard needs its
     macro-series endpoint under the selected Vite architecture.
4. **Production hardening**
   - Add integration tests for the JSON contract and dashboard data loading.
   - Version deployment configuration; keep machine-specific launchd paths out
     of tracked files or provide a templating command.

## Guardrails

- Never present mock prices, transaction records, or fallback data as live.
- Keep external-source failures graceful and label degraded data.
- Preserve user-authored vault notes on every refresh.
- Do not delete prototype files until their replacement is integrated and
  verified.
