# World Money — Obsidian Global Financial Architecture Daemon & Global Liquidity Map

> The current supported product is the Obsidian-first global liquidity map & unified analyst dashboard.
> See [UNIFIED_PLAN.md](UNIFIED_PLAN.md) for architecture decisions, data contracts, and implementation milestones.

A 24/7 background service that builds and continuously maintains an
[Obsidian](https://obsidian.md) vault mapping the global financial system:
every sovereign state, its central bank, its currency, and the interbank
payment rails that move money between them (SWIFT, Fedwire, CHIPS, TARGET2,
SEPA, UPI, CIPS, PIX, FedNow, CHAPS...).

Point it at a folder, open that folder as an Obsidian vault, and you get a
linked graph of ~550 notes — one per country, currency, central bank, and
payment rail — with live FX rates, live policy rates, and live rail
open/closed status refreshed on a schedule, without ever touching notes you
write yourself.

## How it works

- **Structural markdown is fully regenerated every cycle.** Headings,
  tables, and wikilinks are derived purely from source data, so one
  template function scales to 195+ countries with nobody hand-authoring
  files.
- **Fast-changing facts live inside named markers**
  (`<!-- LIVE:NAME:START --> ... <!-- LIVE:NAME:END -->`). Only the text
  between a marker pair is replaced each tick — an FX-rate refresh doesn't
  rewrite the whole file.
- **Everything below `## 📝 Notes` is yours, forever.** The daemon reads
  whatever's below that heading from the existing file (if any) and
  re-appends it verbatim on every regeneration. It never edits below that
  line.
- **Country coverage isn't hardcoded.** At startup the vault builder pulls
  the current list of sovereign states from the maintained
  [mledoze/countries](https://github.com/mledoze/countries) dataset. If the
  network is unavailable it falls back to a small embedded seed so the
  script still runs (in degraded, offline mode) rather than dying.
- **Central banks and payment rails are curated by hand** — there's no
  clean free API for policy mandates or clearing-system operating hours —
  but the curated set is small, and anything missing gets a clean
  auto-generated stub instead of a dangling wikilink, so the graph is
  always internally consistent.

## Vault layout

```
Vault/
├── 00-MOC/              Maps of Content — Dataview-powered index pages
├── 10-Countries/         One tear sheet per sovereign state
├── 20-Central-Banks/     Policy rate, mandate, CBDC status
├── 30-Payment-Rails/     Live open/closed status per clearing system
├── 40-Currencies/        FX hub grouping every country sharing a currency
└── _system/              Cache, logs, exports, and daemon state
```

The daemon also writes a versioned dashboard data contract to
`_system/exports/world-money-graph.v1.json`. It contains countries, central
banks, currencies, payment rails, and typed links between them.

To load that contract in the dashboard, start the daemon with
`--dashboard-port 8765` and set
`VITE_GRAPH_EXPORT_URL=http://127.0.0.1:8765/world-money-graph.v1.json`.

## Global Liquidity Map & MoneyTrace Analyst Dashboard

The repository includes a unified React dashboard featuring:
1. **Global Liquidity Map**:
   - **Macro Liquidity Monitor**: Interactive charts for M2 money supply, Fed Funds policy rate, CPI index, 10-Year Treasury Yields, and Fed Balance Sheet (FRED API / deterministic fallback).
   - **World Bank GDP Comparison**: Sovereign GDP breakdown across major global economies.
   - **Payment Rails Infrastructure Matrix**: Real-time status for global payment clearing systems (SWIFT, Fedwire, CHIPS, TARGET2, SEPA Instant, UPI, CIPS, PIX, FedNow, CHAPS).
   - **Central Bank Policy Hub**: Policy benchmarks, legal mandates, and CBDC development stages.
   - **Obsidian Knowledge Graph**: WebGL relationship network loaded from the daemon data contract.
2. **MoneyTrace AML Intelligence**:
   - Multi-hop transaction path tracing, risk-based alert triage, case annotations, role-aware masking, saved views, and CSV/JSON export.

```bash
npm install
npm run dev
```

Open the Vite URL printed by the command. To build the production bundle:
```bash
npm run build
```

## Requirements

- Python 3.10+
- The [Dataview](https://blacksmithgu.github.io/obsidian-dataview/) Obsidian
  community plugin
- `pip install -r requirements.txt`

## Usage

```bash
# One-off build — good for a first run or a cron job
python3 obsidian_finance_daemon.py --vault-path ./FinanceVault --once

# Run forever, refreshing each data source on its own interval
python3 obsidian_finance_daemon.py --vault-path ./FinanceVault
```

Then open `./FinanceVault` as an Obsidian vault.

### Run continuously with launchd (macOS)

See [`deploy/README.md`](deploy/README.md) and [`deploy/com.worldmoney.finance-daemon.plist.template`](deploy/com.worldmoney.finance-daemon.plist.template).

## Validating the vault

```bash
python3 validate_vault.py ./FinanceVault
```

## Testing

```bash
# Run JavaScript unit & data contract tests
npm test

# Run Python unit tests
python3 -m unittest discover tests
```

## License

MIT — see [LICENSE](LICENSE).
