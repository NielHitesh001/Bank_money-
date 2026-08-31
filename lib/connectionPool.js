/**
 * Production Connection Pooling, Circuit Breaker & Quota Management
 * Handles multi-tenant rate limits and database failover resilience.
 */

export class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
    this.nextAttempt = Date.now();
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN (database temporarily unavailable)');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failureCount,
      nextAttemptIn: Math.max(0, this.nextAttempt - Date.now()),
    };
  }
}

export class QuotaManager {
  constructor() {
    this.usage = new Map();
  }

  async getQuota(tenantId) {
    return this.usage.get(tenantId) || 0;
  }

  async recordUsage(tenantId, queryCount = 1) {
    const current = await this.getQuota(tenantId);
    this.usage.set(tenantId, current + queryCount);
  }

  async checkQuota(tenantId, limit = 1000) {
    const used = await this.getQuota(tenantId);
    return used < limit;
  }

  async getRemainingQuota(tenantId, limit = 1000) {
    const used = await this.getQuota(tenantId);
    return Math.max(0, limit - used);
  }
}

export const dbCircuitBreaker = new CircuitBreaker(5, 60000);
export const quotaManager = new QuotaManager();
