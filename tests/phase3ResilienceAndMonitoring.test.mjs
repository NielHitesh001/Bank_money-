import test from "node:test";
import assert from "node:assert/strict";
import { RateLimiter } from "../src/server/middleware/rateLimiter.js";
import { CircuitBreaker } from "../src/services/brokers/circuitBreaker.js";
import { metricsRegistry } from "../src/server/middleware/metricsCollector.js";

test("RateLimiter allows within quota and blocks when limit is breached", () => {
  const limiter = new RateLimiter({ windowMs: 10000, max: 3 });

  const r1 = limiter.check("user-1");
  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 2);

  const r2 = limiter.check("user-1");
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 1);

  const r3 = limiter.check("user-1");
  assert.equal(r3.allowed, true);
  assert.equal(r3.remaining, 0);

  // 4th request must be blocked
  const r4 = limiter.check("user-1");
  assert.equal(r4.allowed, false);
  assert.ok(r4.resetSeconds >= 1);

  // Different user is independent
  const rOther = limiter.check("user-2");
  assert.equal(rOther.allowed, true);
});

test("CircuitBreaker state machine: CLOSED -> OPEN -> HALF_OPEN -> CLOSED", async () => {
  const cb = new CircuitBreaker("TestBroker", {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 50, // 50ms for test speed
  });

  assert.equal(cb.state, "CLOSED");

  const failingCall = async () => {
    throw new Error("Simulated broker outage");
  };
  const fallback = async (ctx) => ({ fallback: true, reason: ctx.reason });

  // 1st failure
  await cb.execute(failingCall, fallback);
  assert.equal(cb.state, "CLOSED");

  // 2nd failure
  await cb.execute(failingCall, fallback);
  assert.equal(cb.state, "CLOSED");

  // 3rd failure: Trips breaker to OPEN
  const res3 = await cb.execute(failingCall, fallback);
  assert.equal(cb.state, "OPEN");
  assert.equal(res3.fallback, true);

  // While OPEN, does not call failingCall at all and routes straight to fallback
  const res4 = await cb.execute(failingCall, fallback);
  assert.equal(res4.fallback, true);
  assert.ok(res4.reason.includes("is OPEN"));

  // Wait for timeout (50ms) to trigger HALF_OPEN
  await new Promise((r) => setTimeout(r, 60));

  const successfulCall = async () => ({ success: true });

  // 1st probe in HALF_OPEN
  const resHalf1 = await cb.execute(successfulCall, fallback);
  assert.equal(resHalf1.success, true);
  assert.equal(cb.state, "HALF_OPEN");

  // 2nd probe in HALF_OPEN -> Recovers to CLOSED
  const resHalf2 = await cb.execute(successfulCall, fallback);
  assert.equal(resHalf2.success, true);
  assert.equal(cb.state, "CLOSED");
});

test("MetricsRegistry generates standard Prometheus telemetry stream", () => {
  metricsRegistry.incOrder("filled");
  metricsRegistry.incAudit();
  metricsRegistry.observeLatency(15);

  const prom = metricsRegistry.formatPrometheus();
  assert.ok(prom.includes("orders_submitted_total{status=\"filled\"}"));
  assert.ok(prom.includes("audit_log_entries_total"));
  assert.ok(prom.includes("broker_connection_status"));

  const snap = metricsRegistry.getSnapshot();
  assert.ok(snap.latencyP50Ms !== undefined);
  assert.ok(snap.heapMemoryMb !== undefined);
});
