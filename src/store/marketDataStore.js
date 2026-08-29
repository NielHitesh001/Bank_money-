/**
 * Reactive Market Data Store
 * Powered by React useSyncExternalStore + wsMarketManager pub/sub.
 * Provides micro-second reactive state access, selective symbol subscriptions, and health metrics.
 */

import { useSyncExternalStore } from "react";
import { INITIAL_MARKET_TICKERS } from "../services/marketDataAggregator.js";
import { wsMarketManager } from "../services/wsManager.js";

// Internal Store State
class MarketDataStore {
  constructor() {
    this.tickers = new Map(INITIAL_MARKET_TICKERS.map((t) => [t.symbol, { ...t }]));
    this.subscribers = new Set();
    this.connectionState = "CONNECTED"; // "CONNECTED" | "DEGRADED" | "RECONNECTING"
    this.tickCount = 0;
    this.lastTickTime = Date.now();

    // Bind to high-frequency WebSocket / streaming engine
    wsMarketManager.subscribe((updatedTick) => {
      this.tickers.set(updatedTick.symbol, updatedTick);
      this.tickCount += 1;
      this.lastTickTime = Date.now();
      this.notify();
    });
  }

  getState() {
    return {
      tickers: Array.from(this.tickers.values()),
      tickerMap: this.tickers,
      connectionState: this.connectionState,
      tickCount: this.tickCount,
      lastTickTime: this.lastTickTime,
    };
  }

  getTicker(symbol) {
    return this.tickers.get(symbol) || null;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.error("MarketDataStore notification error:", err);
      }
    });
  }

  setConnectionState(state) {
    this.connectionState = state;
    this.notify();
  }
}

// Global Singleton Store Instance
export const marketDataStore = new MarketDataStore();

/**
 * Custom React Hook: useMarketData
 * Subscribes component to reactive market data updates.
 */
export function useMarketData(selector = (state) => state) {
  return useSyncExternalStore(
    (callback) => marketDataStore.subscribe(callback),
    () => selector(marketDataStore.getState())
  );
}

/**
 * Custom React Hook: useSymbolTick
 * Subscribes component strictly to a single symbol's updates.
 */
export function useSymbolTick(symbol) {
  return useSyncExternalStore(
    (callback) => marketDataStore.subscribe(callback),
    () => marketDataStore.getTicker(symbol)
  );
}
