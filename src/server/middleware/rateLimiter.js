/**
 * In-Memory Sliding-Window Rate Limiter
 * Provides microsecond-fast IP/User rate limiting with standard RateLimit headers and 429 enforcement.
 */

export class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute window default
    this.max = options.max || 60; // 60 requests per window
    this.message = options.message || "Rate limit exceeded. Please throttle requests.";
    this.hits = new Map(); // key -> Array of timestamps
  }

  check(key = "global") {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let timestamps = this.hits.get(key) || [];
    // Prune expired timestamps
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= this.max) {
      const resetTimeSec = Math.ceil((timestamps[0] + this.windowMs - now) / 1000);
      return {
        allowed: false,
        limit: this.max,
        remaining: 0,
        resetSeconds: Math.max(1, resetTimeSec),
        message: this.message,
      };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);

    return {
      allowed: true,
      limit: this.max,
      remaining: this.max - timestamps.length,
      resetSeconds: Math.ceil(this.windowMs / 1000),
    };
  }

  reset(key) {
    if (key) {
      this.hits.delete(key);
    } else {
      this.hits.clear();
    }
  }
}

// Pre-configured specialized limiters
export const orderRateLimiter = new RateLimiter({ windowMs: 60000, max: 60, message: "Order submission limit exceeded (Max 60/min)" });
export const vaultRateLimiter = new RateLimiter({ windowMs: 60000, max: 100, message: "Vault token retrieval limit exceeded (Max 100/min)" });
export const auditRateLimiter = new RateLimiter({ windowMs: 60000, max: 1000, message: "Audit ledger write limit exceeded (Max 1000/min)" });
