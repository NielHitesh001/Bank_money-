# Antigravity Terminal: Quick Reference & Command Guide

## Essential Production Commands

### 1. Verification & Testing
```bash
# Run full Node.js test suite
npm test

# Run Python daemon unit tests
python3 -m unittest tests/test_daemon.py

# Run Pre-Market Readiness Certification (10/10 automated checks)
bash scripts/pre-market-checklist.sh
```

### 2. Building & Running
```bash
# Build optimized production frontend bundle
npm run build

# Start backend server with live MCP handlers
npm run server

# Start development client with hot reloading
npm run dev
```

### 3. Monitoring & Telemetry
```bash
# Check Prometheus metrics
curl http://127.0.0.1:8766/metrics

# Check server health endpoint
curl http://127.0.0.1:8766/health
```

### 4. Emergency Procedures
```bash
# Trigger emergency trading kill switch
curl -X POST http://127.0.0.1:8766/api/v1/broker/kill-switch -H "Content-Type: application/json" -d '{"reason": "manual_override"}'

# Verify unbroken audit ledger
curl http://127.0.0.1:8766/api/v1/audit/verify
```
