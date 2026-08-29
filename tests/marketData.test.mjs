import test from "node:test";
import assert from "node:assert/strict";
import { INITIAL_MARKET_TICKERS, normalizeMarketTick } from "../src/services/marketDataAggregator.js";
import { wsMarketManager } from "../src/services/wsManager.js";

test("MarketDataAggregator contains key FX, Commodity, Index, and Crypto tickers", () => {
  assert.ok(INITIAL_MARKET_TICKERS.length >= 10, "Expected at least 10 initial tickers");

  const symbols = INITIAL_MARKET_TICKERS.map((t) => t.symbol);
  assert.ok(symbols.includes("EUR/USD"), "Missing EUR/USD");
  assert.ok(symbols.includes("USD/JPY"), "Missing USD/JPY");
  assert.ok(symbols.includes("XAU/USD"), "Missing Gold Spot");
  assert.ok(symbols.includes("SPX"), "Missing S&P 500");
  assert.ok(symbols.includes("BTC/USD"), "Missing Bitcoin");

  INITIAL_MARKET_TICKERS.forEach((ticker) => {
    assert.ok(ticker.symbol, "Ticker symbol required");
    assert.ok(ticker.bid > 0, `${ticker.symbol} bid must be > 0`);
    assert.ok(ticker.ask >= ticker.bid, `${ticker.symbol} ask must be >= bid`);
    assert.ok(ticker.last > 0, `${ticker.symbol} last must be > 0`);
  });
});

test("normalizeMarketTick conforms to standard Bloomberg tick contract", () => {
  const raw = { symbol: "EUR/USD", last: 1.0950, open: 1.0900, volume: 500000 };
  const normalized = normalizeMarketTick(raw, "test-feed");

  assert.equal(normalized.symbol, "EUR/USD");
  assert.equal(normalized.last, 1.0950);
  assert.equal(normalized.source, "test-feed");
  assert.equal(normalized.change, 0.005);
  assert.equal(normalized.pctChange, 0.46);
  assert.ok(normalized.timestamp);
});

test("wsMarketManager supports ticker retrieval and pub/sub subscriptions", () => {
  const eurusd = wsMarketManager.getTicker("EUR/USD");
  assert.ok(eurusd, "Expected EUR/USD ticker from wsMarketManager");
  assert.equal(eurusd.symbol, "EUR/USD");

  let received = false;
  const unsubscribe = wsMarketManager.subscribeSymbol("EUR/USD", (tick) => {
    received = true;
    assert.equal(tick.symbol, "EUR/USD");
  });

  wsMarketManager.notify({ symbol: "EUR/USD", last: 1.0880, bid: 1.0879, ask: 1.0881 });
  assert.ok(received, "Expected tick notification to be delivered to symbol subscriber");
  unsubscribe();
});
