# World Money Terminal — Regulatory Compliance & SEC Rule 17a-5 Runbook

This document details regulatory recordkeeping, audit trail export, cryptographic chain validation, and reporting schedules.

---

## 1. Regulatory Requirements Matrix

| Regulatory Body | Rule | Requirement | World Money Implementation |
|---|---|---|---|
| **SEC** | **Rule 17a-5** | 6-year retention of immutable order and trade records | SHA-256 blockchain-style hash chain on all submissions |
| **FINRA** | **Rule 4511** | Books and records in write-once-read-many (WORM) format | Append-only database table with cryptographic tampering proofs |
| **CFTC** | **Part 1.31** | Electronic records accessibility and rapid search | Real-time CSV and JSON export streams on `/api/v1/audit-log/export` |

---

## 2. Daily Compliance Ritual (4:00 PM ET)

1. **Export Daily Audit Trail**:
   ```bash
   curl -s "http://127.0.0.1:8766/api/v1/audit-log/export" > audit-$(date +%Y-%m-%d).csv
   ```
2. **Execute Cryptographic Verification**:
   ```bash
   node scripts/verify_audit_integrity.mjs
   ```
3. **Generate Daily Summary Report**:
   ```bash
   node scripts/generate_compliance_report.mjs
   ```
4. **Archive Report**:
   Store the resulting JSON report in `./FinanceVault/_system/compliance_reports/`.

---

## 3. Cryptographic Chain Schema

Each log entry satisfies:
$$\text{Hash}_n = \text{SHA-256}\Big(\text{JSON}(\text{Entry}_n) + \text{Hash}_{n-1}\Big)$$

- **Genesis Hash**: `0000000000000000000000000000000000000000000000000000000000000000`
- Any modification to `amount`, `symbol`, `price`, or `user` breaks all succeeding hashes in the chain.
