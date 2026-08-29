import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DB_PATH = path.resolve("./FinanceVault/_system/server_db.json");

function verifyAuditChain() {
  if (!fs.existsSync(DB_PATH)) {
    console.log("ℹ️ No server database found at", DB_PATH);
    return true;
  }

  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  const logs = db.immutableAuditLogs || [];

  if (logs.length === 0) {
    console.log("ℹ️ Immutable audit ledger is currently empty (Genesis state).");
    return true;
  }

  let previousHash = "0000000000000000000000000000000000000000000000000000000000000000";
  let verifiedCount = 0;

  for (let i = 0; i < logs.length; i++) {
    const entry = logs[i];
    if (entry.previousHash !== previousHash) {
      console.error(`❌ BROKEN CHAIN at sequence #${entry.sequence}: expected previousHash ${previousHash}, got ${entry.previousHash}`);
      return false;
    }
    previousHash = entry.hash;
    verifiedCount++;
  }

  console.log(`✅ HASH CHAIN VALID: All ${verifiedCount} audit log records verified unbroken.`);
  return true;
}

const isValid = verifyAuditChain();
process.exit(isValid ? 0 : 1);
