# MoneyTrace API contract (prototype handoff)

All endpoints require an OIDC access token. The API determines the caller's role and returns a masked projection; the client must not be trusted to enforce authorization.

## Graph query

`GET /v1/graph?caseId=CASE-1842&minRisk=80&currency=USD&minimumAmount=10000000&from=2026-08-28T00:00:00Z&to=2026-08-29T23:59:59Z`

Response:

```json
{
  "entities": [{ "id": "NORD-EE", "name": "NordEast Commerce OÜ", "kind": "Regional Institution", "country": "EE", "lei": "549300TESTNORD8EAST7", "bic": "NECOEE2X", "risk": 84, "aml": { "pep": "Clear", "sanctions": "Review", "typologies": ["Rapid pass-through"] } }],
  "transactions": [{ "id": "TX-2026-08494", "source": "NORD-EE", "target": "HARBOR-AE", "amount": 12400000, "currency": "USD", "rail": "SWIFT", "date": "2026-08-29T09:28:00Z", "risk": 94, "flag": "Sanctions proximity", "routing": { "correspondent": "NECOEE2X → CBUAUAEX → HARBOR-AE" } }],
  "page": { "matchedEntities": 12300, "matchedTransactions": 79000, "renderHint": { "maxNodes": 2000, "maxEdges": 5000 } }
}
```

The service applies authorization and coarse filters. The client may make presentation-only filters stricter, but must never widen the server result.

## Directed trace

`POST /v1/traces`

```json
{ "sourceEntityId": "JPM-US", "targetEntityId": "HARBOR-AE", "maxHops": 6, "filters": { "minRisk": 55 } }
```

Response: `{ "nodeIds": ["JPM-US", "DB-DE", "NORD-EE", "HARBOR-AE"], "edgeIds": ["TX-2026-08492", "TX-2026-08493", "TX-2026-08494"] }`.

Traversal must be bounded server-side by hop count, authorization scope, timeout, and result size.

## Batch intake

`POST /v1/intake/batches` accepts `multipart/form-data` CSV or JSON. The server stores the raw payload separately, validates identifiers and schemas, and returns an asynchronous job:

```json
{ "jobId": "ing_01J...", "status": "accepted", "acceptedEntities": 12, "acceptedTransactions": 830, "rejected": [] }
```

`GET /v1/intake/batches/{jobId}` returns completion status and field-level rejection details. Intake is Admin-only.

## Cases and annotations

- `GET /v1/cases?status=open`
- `POST /v1/cases/{caseId}/subjects` with `{ "subjectType": "transaction", "subjectId": "TX-2026-08494" }`
- `POST /v1/cases/{caseId}/annotations` with `{ "body": "Reviewed beneficiary routing." }`
- `POST /v1/alerts/{transactionId}/triage` with `{ "disposition": "reviewed", "note": "..." }`

Analysts may create flags; Investigators and Admins may modify cases and triage alerts. Each mutation uses a request id and produces an append-only audit event.

## Reports and audit

- `POST /v1/exports` with `{ "format": "csv" | "json", "filters": {}, "caseId": "CASE-1842" }`
- `GET /v1/audit-events?caseId=CASE-1842&cursor=...`

Export creation is audited before the download URL is issued. Audit events carry actor, role, action, resource, request id, and a tamper-evident event hash chain.
