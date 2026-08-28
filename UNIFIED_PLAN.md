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

## Supporting prototypes and architecture

- The Vite React app provides a unified analyst interface featuring:
  1. **Global Liquidity Map**: Macro monetary base charts (FRED M2, Fed Funds, CPI, 10Y Yields, Balance Sheets, World Bank GDP), Payment Rails Infrastructure Matrix (SWIFT, Fedwire, CHIPS, TARGET2, SEPA, UPI, CIPS, PIX, FedNow, CHAPS), Central Bank Policy Hub, and the Obsidian Knowledge Graph.
  2. **MoneyTrace AML Intelligence**: Multi-hop path tracing, alert triage, case annotations, role-aware masking, saved views, and CSV/JSON reporting.
- Prototypes are organized in `prototypes/` (`mock-stream/` and `next-api/`).
- Service deployment configurations are versioned as templates in `deploy/`.

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
3. **Dashboard integration — complete**
   - Unified interface with direct navigation between the Global Liquidity Map and MoneyTrace AML Workspace.
   - Replaced legacy ticker-specific mock panels with contract-backed macro liquidity, payment rail matrix, and central bank hubs.
   - Configurable live/fallback data providers with indicators.
4. **Production hardening & repository organization — complete**
   - Automated test suite for data contracts, graph export schema, and macro services (`tests/dataContract.test.mjs`).
   - Hardened daemon unit tests (`tests/test_daemon.py`).
   - Parameterized launchd deployment template (`deploy/`).
   - Cleaned root repository structure with organized documentation in `docs/`.

## Guardrails

- Never present mock prices, transaction records, or fallback data as live.
- Keep external-source failures graceful and label degraded data.
- Preserve user-authored vault notes on every refresh.
- Maintain internal link consistency and graph invariants across every vault generation cycle.
