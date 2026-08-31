-- ============================================================================
-- PRODUCTION QUERY AUDIT & OPTIMIZATION SUITE
-- Purpose: Identify slow queries, validate indexes, and benchmark under load
-- Target: p99 latency <100ms for all endpoint queries
-- ============================================================================

-- ============================================================================
-- SECTION 1: DIAGNOSTIC QUERIES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Query 1.1a: Slowest queries by total time
SELECT
  query,
  calls,
  mean_exec_time::numeric(10,2) as avg_ms,
  max_exec_time::numeric(10,2) as max_ms,
  total_exec_time::numeric(15,2) as total_ms,
  stddev_exec_time::numeric(10,2) as stddev_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 10;

-- Query 1.1b: Most frequently called queries (watch for N+1 patterns)
SELECT
  query,
  calls,
  mean_exec_time::numeric(10,2) as avg_ms,
  (calls * mean_exec_time)::numeric(15,2) as cumulative_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY calls DESC
LIMIT 20;

-- ============================================================================
-- SECTION 2: INDEX HEALTH CHECK
-- ============================================================================

-- Query 2.1: Unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE 'pg_toast%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Query 2.2: Missing indexes
SELECT
  schemaname,
  tablename,
  seq_scan as sequential_scans,
  seq_tup_read as sequential_tuples_read,
  idx_scan as index_scans,
  ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2) as seq_scan_pct
FROM pg_stat_user_tables
WHERE (seq_scan + idx_scan) > 1000
  AND ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2) > 50
ORDER BY seq_scan DESC;

-- ============================================================================
-- SECTION 3: HOT PATH QUERY PERFORMANCE
-- ============================================================================

-- Query 3.1: GET /api/v1/corridors
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
  id,
  source_currency,
  dest_currency,
  primary_rail,
  status,
  p99_latency_ms,
  daily_volume_usd,
  settlement_window_open,
  settlement_window_close,
  rtgs_operational,
  updated_at
FROM corridors
WHERE status = 'live'
ORDER BY updated_at DESC
LIMIT 100;

-- Query 3.2: GET /api/v1/audit/verify
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
  sequence,
  timestamp,
  event_type,
  hash_current,
  hash_previous
FROM audit_logs
WHERE sequence > (SELECT MAX(sequence) - 1000 FROM audit_logs)
ORDER BY sequence ASC;

-- ============================================================================
-- SECTION 4: CONCURRENT PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_timestamp_sequence
ON audit_logs(timestamp DESC, sequence DESC)
WHERE event_type IN ('order_executed', 'order_rejected', 'settlement_confirmed');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_entity_lookups
ON transactions(source_entity_id, target_entity_id, date DESC)
WHERE risk_score > 50;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_corridors_settlement_window
ON corridors(status, settlement_window_open, settlement_window_close)
WHERE rtgs_operational = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_payload_user_gin
ON audit_logs USING gin(payload jsonb_path_ops)
WHERE event_type = 'order_executed';
