-- =============================================================================
-- World Money Terminal OS — Production PostgreSQL Schema v2.1
-- SEC Rule 17a-5 / FINRA Rule 4511 Compliant Audit & Trade Ledger
-- High-Throughput Partitioned Schema for Global Corridors & Financial Graphs
-- =============================================================================

-- 1. Sovereign Corridors Table
CREATE TABLE IF NOT EXISTS corridors (
  id VARCHAR(64) PRIMARY KEY,
  source_currency VARCHAR(10) NOT NULL,
  dest_currency VARCHAR(10) NOT NULL,
  primary_rail VARCHAR(32) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'live', -- 'live', 'degraded', 'offline'
  p99_latency_ms DECIMAL(8, 2) NOT NULL DEFAULT 0.0,
  daily_volume_usd DECIMAL(18, 2) NOT NULL DEFAULT 0.0,
  settlement_window_open TIME NOT NULL,
  settlement_window_close TIME NOT NULL,
  rtgs_operational BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Transactions Table (Partitioned by Monthly Range for 10M+ Scale)
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(64) NOT NULL,
  source_entity_id VARCHAR(64) NOT NULL,
  target_entity_id VARCHAR(64) NOT NULL,
  amount DECIMAL(18, 4) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  corridor_id VARCHAR(64) REFERENCES corridors(id),
  rail VARCHAR(32) NOT NULL,
  risk_score SMALLINT NOT NULL DEFAULT 0,
  flag VARCHAR(64),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, date)
) PARTITION BY RANGE (date);

-- Default / Initial Monthly Partitions
CREATE TABLE IF NOT EXISTS transactions_2026_08 PARTITION OF transactions
  FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS transactions_2026_09 PARTITION OF transactions
  FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

-- 3. Cryptographically Chained Audit Ledger
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  sequence BIGINT UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type VARCHAR(50) NOT NULL,
  order_id VARCHAR(100),
  symbol VARCHAR(20),
  amount DECIMAL(18, 4),
  user_id VARCHAR(100) NOT NULL,
  hash_current VARCHAR(64) NOT NULL,
  hash_previous VARCHAR(64) NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Broker Execution Positions & Fills
CREATE TABLE IF NOT EXISTS positions (
  id VARCHAR(100) PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL,
  quantity DECIMAL(18, 8) NOT NULL,
  entry_price DECIMAL(18, 8) NOT NULL,
  current_price DECIMAL(18, 8) NOT NULL,
  notional DECIMAL(18, 2) NOT NULL,
  margin DECIMAL(18, 2) NOT NULL,
  leverage DECIMAL(5, 2) NOT NULL,
  unrealized_pnl DECIMAL(18, 2) DEFAULT 0,
  realized_pnl DECIMAL(18, 2) DEFAULT 0,
  carry_rate_annual DECIMAL(5, 2) DEFAULT 0,
  holding_days INTEGER DEFAULT 0,
  fee_paid DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) UNIQUE NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL,
  quantity DECIMAL(18, 8) NOT NULL,
  fill_price DECIMAL(18, 8) NOT NULL,
  notional DECIMAL(18, 2) NOT NULL,
  margin DECIMAL(18, 2) NOT NULL,
  leverage DECIMAL(5, 2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  venue VARCHAR(50) NOT NULL,
  filled_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Optimized Performance & B-Tree / GIN Indexes
CREATE INDEX IF NOT EXISTS idx_corridors_status ON corridors(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_corridors_currencies ON corridors(source_currency, dest_currency);
CREATE INDEX IF NOT EXISTS idx_transactions_corridor_date ON transactions(corridor_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_source_target ON transactions(source_entity_id, target_entity_id);
CREATE INDEX IF NOT EXISTS idx_transactions_risk ON transactions(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_sequence ON audit_logs(sequence);
CREATE INDEX IF NOT EXISTS idx_audit_payload_gin ON audit_logs USING gin(payload);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_filled_at ON trades(filled_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
