import test from "node:test";
import assert from "node:assert/strict";
import { CircuitBreaker, QuotaManager } from "../lib/connectionPool.js";
import { ImmutableAuditLog } from "../src/services/auditLog/immutableAuditLog.js";

test("Chaos: Circuit Breaker state transitions from CLOSED to OPEN under failures", async () => {
  const cb = new CircuitBreaker(3, 500); // Fail after 3 errors, recover after 500ms
  assert.equal(cb.getState().state, "CLOSED");

  // Trigger 3 failures
  for (let i = 0; i < 3; i++) {
    try {
      await cb.call(async () => {
        throw new Error("Simulated database failure");
      });
    } catch {
      // expected
    }
  }

  assert.equal(cb.getState().state, "OPEN");

  // Call while OPEN should fast-fail
  await assert.rejects(
    async () => {
      await cb.call(async () => "ok");
    },
    { message: /Circuit breaker is OPEN/ }
  );

  // Wait for recovery timeout
  await new Promise((resolve) => setTimeout(resolve, 550));

  // Should succeed and transition back to CLOSED
  const result = await cb.call(async () => "recovered");
  assert.equal(result, "recovered");
  assert.equal(cb.getState().state, "CLOSED");
});

test("Chaos: Quota Manager limits tenant excessive usage", async () => {
  const qm = new QuotaManager();
  const tenant = "tenant_pilot_1";

  assert.equal(await qm.checkQuota(tenant, 5), true);

  await qm.recordUsage(tenant, 4);
  assert.equal(await qm.getRemainingQuota(tenant, 5), 1);
  assert.equal(await qm.checkQuota(tenant, 5), true);

  await qm.recordUsage(tenant, 2); // 6 total
  assert.equal(await qm.checkQuota(tenant, 5), false);
  assert.equal(await qm.getRemainingQuota(tenant, 5), 0);
});

test("Chaos: Audit Log preserves SHA-256 chain integrity under failed transactions", async () => {
  const audit = new ImmutableAuditLog();

  await audit.logOrderSubmission({ id: "ORD-001", symbol: "SPY", units: 10, notional: 5800 });
  await audit.logRiskGuardrailTriggered("FLASH_CRASH_PROTECTION", { symbol: "SPY", notional: 100000 }, "Max notional breach");

  const verification = audit.verifyChainIntegrity();
  assert.equal(verification.valid, true);
  assert.equal(verification.count, 2);
});
