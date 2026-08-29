/**
 * Enterprise Circuit Breaker Pattern for Broker & External API Connections
 * State Transitions: CLOSED (normal) -> OPEN (tripped) -> HALF_OPEN (probing) -> CLOSED (recovered)
 */

export class CircuitBreaker {
  constructor(name = "BrokerApi", options = {}) {
    this.name = name;
    this.state = "CLOSED"; // "CLOSED" | "OPEN" | "HALF_OPEN"
    this.failureCount = 0;
    this.successCount = 0;
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000; // 60 sec cooldown
    this.lastFailureTime = null;
    this.listeners = new Set();
  }

  async execute(primaryFn, fallbackFn) {
    // 1. Check if OPEN and whether cooldown has expired
    if (this.state === "OPEN") {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed > this.timeout) {
        this.transitionTo("HALF_OPEN");
      } else {
        return await fallbackFn({
          reason: `Circuit breaker ${this.name} is OPEN (${Math.ceil((this.timeout - elapsed) / 1000)}s cooldown remaining)`,
          state: this.state,
        });
      }
    }

    // 2. Attempt Execution
    try {
      const result = await primaryFn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      if (fallbackFn) {
        return await fallbackFn({ reason: `Primary call failed: ${err.message}`, state: this.state });
      }
      throw err;
    }
  }

  onSuccess() {
    if (this.state === "HALF_OPEN") {
      this.successCount += 1;
      if (this.successCount >= this.successThreshold) {
        this.failureCount = 0;
        this.successCount = 0;
        this.transitionTo("CLOSED");
      }
    } else {
      this.failureCount = 0;
    }
  }

  onFailure(err) {
    this.lastFailureTime = Date.now();
    this.failureCount += 1;

    if (this.state === "HALF_OPEN" || this.failureCount >= this.failureThreshold) {
      this.transitionTo("OPEN");
    }
  }

  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    this.notify({ oldState, newState, timestamp: new Date().toISOString() });
  }

  notify(event) {
    this.listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error("Circuit breaker listener error:", err);
      }
    });
  }

  onStateChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      lastFailureTime: this.lastFailureTime,
      timeout: this.timeout,
    };
  }

  reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}

// Global Singleton Instance for Alpaca
export const alpacaCircuitBreaker = new CircuitBreaker("AlpacaExecutionAPI", {
  failureThreshold: 5,
  timeout: 60000,
});
