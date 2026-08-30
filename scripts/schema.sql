-- =============================================================================
-- World Money Terminal OS — Production PostgreSQL Schema
-- SEC Rule 17a-5 / FINRA Rule 4511 Compliant Audit & Trade Ledger
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  sequence BIGINT UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
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

CREATE TABLE IF NOT EXISTS compliance_reports (
  id SERIAL PRIMARY KEY,
  report_date DATE UNIQUE NOT NULL,
  total_trades INTEGER NOT NULL,
  total_notional DECIMAL(18, 2) NOT NULL,
  hash_chain_valid BOOLEAN NOT NULL,
  root_hash VARCHAR(64) NOT NULL,
  report_json JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimized Performance Indexes
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_sequence ON audit_logs(sequence);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_filled_at ON trades(filled_at);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
