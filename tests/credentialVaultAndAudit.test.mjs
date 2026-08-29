import test from "node:test";
import assert from "node:assert/strict";
import { ImmutableAuditLog, computeSha256 } from "../src/services/auditLog/immutableAuditLog.js";
import { CredentialVault } from "../src/services/credentialVault.js";

test("ImmutableAuditLog establishes cryptographic SHA-256 hash chaining", async () => {
  const audit = new ImmutableAuditLog();

  const order1 = { id: "ORD-001", symbol: "EUR/USD", side: "BUY", units: 10000, notional: 10874 };
  const log1 = await audit.logOrderSubmission(order1, "TRADER-ALICE", true, "Long carry entry");

  assert.ok(log1.hash, "Hash required on log entry");
  assert.equal(log1.previousHash, "0000000000000000000000000000000000000000000000000000000000000000");

  const order2 = { id: "ORD-002", symbol: "USD/JPY", side: "SELL", units: 5000, notional: 72715 };
  const log2 = await audit.logOrderSubmission(order2, "TRADER-BOB", true, "Carry short entry");

  assert.equal(log2.previousHash, log1.hash, "Log 2 previousHash must link to Log 1 hash");

  const guardrailLog = await audit.logRiskGuardrailTriggered("MAX_NOTIONAL", { symbol: "SPX", units: 100, notional: 563400 }, "Exceeded order cap");
  assert.equal(guardrailLog.previousHash, log2.hash, "Guardrail entry must link to previous log hash");

  // Verify chain integrity
  const integrity = audit.verifyChainIntegrity();
  assert.equal(integrity.valid, true);
  assert.equal(integrity.count, 3);
});

test("ImmutableAuditLog detects tampering in hash chain", async () => {
  const audit = new ImmutableAuditLog();
  await audit.logOrderSubmission({ id: "ORD-1", symbol: "EUR/USD", units: 1000 }, "ALICE");
  await audit.logOrderSubmission({ id: "ORD-2", symbol: "USD/JPY", units: 2000 }, "BOB");

  // Tamper with first record's hash
  audit.localLog[0].hash = "tampered_fake_hash_123456";

  const integrity = audit.verifyChainIntegrity();
  assert.equal(integrity.valid, false);
  assert.ok(integrity.error.includes("Broken chain"));
});

test("CredentialVault manages short-lived memory cache and revocation", async () => {
  const vault = new CredentialVault();
  vault.cachedToken = "cached-access-token-xyz";
  vault.tokenExpiry = Date.now() + 60000; // 1 min in future

  const res = await vault.getAlpacaAccessToken();
  assert.equal(res.accessToken, "cached-access-token-xyz");

  await vault.revokeAllTokens();
  assert.equal(vault.cachedToken, null);
  assert.equal(vault.tokenExpiry, null);
});
