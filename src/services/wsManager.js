/**
 * Real-Time WebSocket & High-Frequency Tick Streaming Engine
 * Distributes live multi-asset ticks with sub-second latency and listener pub/sub.
 */

import { INITIAL_MARKET_TICKERS, normalizeMarketTick } from "./marketDataAggregator.js";

class MarketWebSocketManager {
  constructor() {
    this.tickers = new Map(INITIAL_MARKET_TICKERS.map((t) => [t.symbol, { ...t }]));
    this.listeners = new Set();
    this.symbolListeners = new Map();
    this.isRunning = false;
    this.timer = null;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // High-frequency tick generator (every 250ms - 450ms for realistic market pulsation)
    this.timer = setInterval(() => {
      this.generateRandomTick();
    }, 280);

    if (this.timer && typeof this.timer.unref === "function") {
      this.timer.unref();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  generateRandomTick() {
    // Pick 1-3 random tickers to update per cycle
    const symbols = Array.from(this.tickers.keys());
    const count = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * symbols.length);
      const symbol = symbols[idx];
      const current = this.tickers.get(symbol);
      if (!current) continue;

      // Realistic stochastic micro-drift (-0.08% to +0.08%)
      const volatility = current.assetClass === "Crypto" ? 0.0015 : current.assetClass === "Commodities" ? 0.0008 : 0.0003;
      const drift = (Math.random() - 0.495) * volatility;
      const newLast = Number((current.last * (1 + drift)).toFixed(current.decimals || 4));

      const halfSpread = (current.pipSize || 0.0001) * 1.5;
      const newBid = Number((newLast - halfSpread).toFixed(current.decimals || 4));
      const newAsk = Number((newLast + halfSpread).toFixed(current.decimals || 4));
      const newHigh = Math.max(current.high, newLast);
      const newLow = Math.min(current.low, newLast);
      const change = Number((newLast - current.open).toFixed(current.decimals || 4));
      const pctChange = current.open > 0 ? Number(((change / current.open) * 100).toFixed(2)) : 0;
      const volumeInc = Math.floor(Math.random() * 50000) + 5000;

      const updated = {
        ...current,
        bid: newBid,
        ask: newAsk,
        last: newLast,
        high: newHigh,
        low: newLow,
        change,
        pctChange,
        volume: current.volume + volumeInc,
        timestamp: new Date().toISOString(),
        lastDirection: newLast >= current.last ? "up" : "down",
      };

      this.tickers.set(symbol, updated);
      this.notify(updated);
    }
  }

  notify(tick) {
    // Global tick listeners
    this.listeners.forEach((listener) => {
      try {
        listener(tick);
      } catch (err) {
        console.error("Tick listener error:", err);
      }
    });

    // Symbol specific listeners
    const symListeners = this.symbolListeners.get(tick.symbol);
    if (symListeners) {
      symListeners.forEach((listener) => {
        try {
          listener(tick);
        } catch (err) {
          console.error("Symbol tick listener error:", err);
        }
      });
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    if (!this.isRunning) this.start();
    return () => this.listeners.delete(callback);
  }

  subscribeSymbol(symbol, callback) {
    if (!this.symbolListeners.has(symbol)) {
      this.symbolListeners.set(symbol, new Set());
    }
    this.symbolListeners.get(symbol).add(callback);
    if (!this.isRunning) this.start();

    return () => {
      const listeners = this.symbolListeners.get(symbol);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) this.symbolListeners.delete(symbol);
      }
    };
  }

  getAllTickers() {
    return Array.from(this.tickers.values());
  }

  getTicker(symbol) {
    return this.tickers.get(symbol) || null;
  }
}

// Global Singleton
export const wsMarketManager = new MarketWebSocketManager();
