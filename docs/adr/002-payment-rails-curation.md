# ADR 002: Payment Rails Curation & Verification Engine

## Status: Accepted

## Context
Global financial rails (SWIFT, Fedwire, CHIPS, TARGET2, UPI, CIPS, PIX, FedNow, CHAPS) have distinct operating hours, currency coverages, and settlement mechanisms. Real-time API availability varies drastically by jurisdiction.

## Decision
We implement a hybrid curation engine combining verified static topology definitions (`CURATED_PAYMENT_RAILS`) with real-time dynamic status checks and market settlement indicators.

## Consequences
- **Positive**: Resilient against third-party API downtime; deterministic validation for financial routing.
- **Negative**: Requires periodic manual regulatory audits for new cross-border payment protocols.
