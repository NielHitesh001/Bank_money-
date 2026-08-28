# MoneyTrace frontend contract and proposed production architecture

The prototype uses React + TypeScript-ready Vite, CSS tokens, and Sigma.js/Graphology (WebGL). It deliberately keeps the UI data adapter independent from the current mock data.

## Recommended production stack

- Frontend: React, TypeScript, Vite, TanStack Query, Zustand, Tailwind + design tokens, Sigma.js/Graphology.
- API: NestJS or Fastify service behind an API gateway; REST for transactional intake/query and WebSocket/SSE for graph updates.
- Stores: PostgreSQL for users, cases, audit records, and operational metadata; Neo4j for bounded multi-hop traversal; Kafka + object storage for durable raw ingestion; OpenSearch for indexed filters.
- Security: OIDC/SAML identity provider, role and attribute policy enforcement server-side, field-level redaction, encryption in transit/at rest, append-only audit event sink.

## Normalized core schema

`legal_entities(id UUID, lei CHAR(20) UNIQUE, legal_name, entity_type, bic VARCHAR(11), jurisdiction_iso CHAR(2), status, created_at)`

`accounts(id UUID, entity_id FK, account_identifier_ciphertext, identifier_type ENUM(IBAN, ACCOUNT_ID), country_iso CHAR(2), masked_display, created_at)`

`transactions(id UUID, external_reference UNIQUE, source_account_id FK, destination_account_id FK, currency CHAR(3), amount DECIMAL(22,4), rail ENUM(SWIFT, ACH, FEDWIRE, CHAPS, RTGS, TRADE_FINANCE, VC), initiated_at, settled_at, status, routing JSONB)`

`risk_assessments(id UUID, subject_type, subject_id, score SMALLINT CHECK(score BETWEEN 0 AND 100), pep_status, sanctions_status, typologies JSONB, provider, assessed_at)`

`screening_matches(id UUID, subject_type, subject_id, list_name, match_score, disposition, reviewed_by, reviewed_at)`

`cases(id UUID, case_number UNIQUE, title, status, severity, owner_id, created_at)` with `case_subjects(case_id FK, subject_type, subject_id)` and `annotations(id UUID, case_id FK, author_id, body, created_at)`.

`audit_events(id UUID, occurred_at, actor_id, role, action, resource_type, resource_id, request_id, ip_hash, before_hash, after_hash)` is written append-only to a separate immutable retention store. Exports are represented by `export_jobs` and audited before file delivery.

All personal identifiers remain encrypted or tokenized at rest; UI responses receive a role-aware masked projection. Ingestion accepts REST event envelopes and CSV/JSON batches, validates identifiers and ISO codes, then writes raw payloads and normalized records independently.

## Frontend integration contract

The analyst workspace consumes a normalized graph snapshot with three top-level collections:

```js
{
  entities: [{ id, name, kind, country, lei?, bic?, account?, risk, volume, x, y }],
  transactions: [{ id, source, target, amount, display, currency, rail, date, risk, flag? }],
  cases: [{ id, title, severity, transactions, updated }]
}
```

The production adapter should expose `getGraphSnapshot(filters)`, `ingestBatch(payload)`, `saveCaseMutation(mutation)`, and `appendAuditEvent(event)`. The current prototype keeps those operations local, but all filtering, path tracing, exports, case mutations, and audit events operate on these same shapes.

For dense snapshots, the UI defers free-text search, indexes entity lookups by ID, and caps the active render at 2,000 nodes and 5,000 edges. The adapter can return larger datasets; the view layer prioritizes higher-risk and higher-exposure records for the active canvas while preserving matched-record counts.
