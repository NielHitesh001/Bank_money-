# World Money — Obsidian Global Financial Architecture Daemon

> The current supported product is the Obsidian-first global liquidity map.
> See [UNIFIED_PLAN.md](UNIFIED_PLAN.md) for the architecture decision,
> prototype boundaries, and implementation sequence.

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
└── _system/              Cache, logs, and daemon state (not vault content)
```

The daemon also writes a versioned dashboard data contract to
`_system/exports/world-money-graph.v1.json`. It contains countries, central
banks, currencies, payment rails, and typed links between them.

To load that contract in the Vite dashboard, start the daemon with
`--dashboard-port 8765` and set
`VITE_GRAPH_EXPORT_URL=http://127.0.0.1:8765/world-money-graph.v1.json`.
The endpoint binds only to localhost. Set `VITE_GRAPH_STREAM_URL` only for a
compatible incremental-update WebSocket; otherwise the dashboard keeps the
stream disabled. Without an export URL, the dashboard labels its sample graph
as `DATA: DEMO`.

## Requirements

- Python 3.10+
- The [Dataview](https://blacksmithgu.github.io/obsidian-dataview/) Obsidian
  community plugin, to render the `TABLE ...` queries embedded in the MOC
  pages
- `pip install -r requirements.txt`

## Usage

```bash
# One-off build — good for a first run or a cron job
python3 obsidian_finance_daemon.py --vault-path ./FinanceVault --once

# Run forever, refreshing each data source on its own interval
python3 obsidian_finance_daemon.py --vault-path ./FinanceVault
```

Then open `./FinanceVault` as an Obsidian vault.

Refresh intervals (FX every 15 min, rail status every 60s, policy rates
every 6h, country metadata daily) are set in `Config` at the top of
`obsidian_finance_daemon.py`.

### Run continuously with launchd (macOS)

1. Clone this repo somewhere permanent, e.g. `~/Projects/World_money`.
2. Create a virtualenv and install dependencies:
   ```bash
   cd ~/Projects/World_money
   python3 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   ```
3. Copy `com.worldmoney.finance-daemon.plist` to
   `~/Library/LaunchAgents/`, and replace every
   `/ABSOLUTE/PATH/TO/World_money` placeholder in it with the real path
   from step 1.
4. Load it:
   ```bash
   launchctl load ~/Library/LaunchAgents/com.worldmoney.finance-daemon.plist
   ```

## Data sources

| Data | Source | Notes |
|---|---|---|
| Country list, capitals, regions | [mledoze/countries](https://github.com/mledoze/countries) | Free, no key. Cached; falls back to an embedded seed offline. |
| Population | [restcountries.com](https://restcountries.com) | Free, no key. mledoze's feed no longer includes population. |
| FX rates | [frankfurter.app](https://www.frankfurter.app) | ECB reference rates, USD base. |
| Policy rates (US, Eurozone) | [FRED](https://fred.stlouisfed.org) | Covers the Fed and ECB only today; everything else is the curated seed in `CURATED_CENTRAL_BANKS`. |
| Central banks (mandate, CBDC status) | Hand-curated in `CURATED_CENTRAL_BANKS` | ~25 major economies today; anything else gets an auto-stub. |
| Payment rails (hours, operator) | Hand-curated in `CURATED_PAYMENT_RAILS` | SWIFT, Fedwire, CHIPS, FedNow, TARGET2, SEPA Instant, CHAPS, UPI, CIPS, Pix. |

To extend coverage, add entries to `CURATED_CENTRAL_BANKS` or
`CURATED_PAYMENT_RAILS` in `obsidian_finance_daemon.py` — the template
plumbing already supports any entity you add.

## Validating the vault

```bash
python3 validate_vault.py ./FinanceVault
```

Checks every generated file for YAML frontmatter, balanced Dataview
blocks, and wikilinks that actually resolve to a file in the vault.

## Testing

```bash
pip install pytest
pytest tests/
```

## License

MIT — see [LICENSE](LICENSE).
