# Architectural Decision Records (ADRs): World Money Terminal OS

---

## AD-001: Unified Monolithic Dashboard vs. Monorepo Packages
- **Status**: Accepted
- **Context**: Deciding whether to split the terminal into an independent `@world-money/terminal` npm workspace package or keep it within the root repository.
- **Decision**: Keep Terminal UI in `/components/Terminal/` and analytics in `/src/analytics/` within the single unified Vite app.
- **Rationale**: Simplifies dependency bundling, enables instant Hot Module Replacement (HMR) across MoneyTrace and Terminal, shares global command navigation without inter-package publish steps, and keeps production bundle size compact (528 KB gzipped).
- **Future Pathway**: If engineering team expands beyond 3+ distributed teams, extract cleanly into `packages/terminal/`.

---

## AD-002: Reactive State Architecture via `useSyncExternalStore` & Pub/Sub
- **Status**: Accepted
- **Context**: Real-time trading terminals require high-frequency tick updates (200–300ms) without triggering wasteful re-renders across static UI panels.
- **Decision**: Use `src/store/marketDataStore.js` powered by React's native `useSyncExternalStore` and `wsMarketManager.js` pub/sub bus.
- **Rationale**: Zero external bundle weight, sub-millisecond selector evaluation, and strict isolation between high-frequency pricing updates and low-frequency UI state.

---

## AD-003: Stochastic Brownian Motion Fallback for Offline Dev & Testing
- **Status**: Accepted
- **Context**: Automated test suites and offline developers must be able to run and test full trading blotter, charting, and OMS features without paying for live API subscriptions or failing CI pipelines on network partitions.
- **Decision**: Pre-build a realistic multi-asset stochastic drift generator with unreffed timers in `src/services/wsManager.js`.
- **Rationale**: Tests execute in <80ms with 100% determinism while development feels live and reactive.

---

## AD-004: Direct SVG/Canvas Rendering for High-Frequency Candlestick Charts
- **Status**: Accepted
- **Context**: Heavy charting libraries (e.g. standard TradingView full bundles) often introduce 1.5MB+ bundle bloat and opaque lifecycle hooks.
- **Decision**: Implement lightweight, zero-dependency SVG candlestick charts with memoized SMA 20 and RSI 14 calculation pipelines.
- **Rationale**: Sub-5ms render cycles, 60 FPS animation smoothness, and total control over Bloomberg dark terminal styling.
