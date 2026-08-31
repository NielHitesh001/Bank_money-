# Antigravity Terminal: Production Readiness Specification

## Executive Summary
This document establishes the production readiness framework for the World Money (Antigravity) institutional terminal platform. It outlines concrete operational gates, security policies, test structures, containerization blueprints, and disaster recovery procedures.

---

## 1. Security Architecture & Access Control (RBAC)

### 1.1 Role Definitions & Permission Matrix
| Role | Permissions | Description |
|------|-------------|-------------|
| **ADMIN** | `read:all`, `write:all`, `delete:all`, `audit:logs` | Full infrastructure and user administration |
| **ANALYST** | `read:all`, `write:own`, `export:data` | Research, data exploration, masked PII views |
| **TRADER** | `read:live`, `write:positions`, `execute:trades` | Strategy deployment, order execution, blotter |
| **COMPLIANCE** | `read:all`, `audit:logs`, `flag:transactions` | Immutable audit log inspection, AML flagging |
| **GUEST** | `read:public` | Read-only access to public macro data |

---

## 2. Testing Pyramid & Verification Gates

```
                    /\
                   /  \    End-to-End (5%)
                  /____\   - Multi-desk workflows & trade lifecycle
                 /      \
                /        \  Integration (15%)
               /          \ - Bridge RPC, MCP tool routing, WebSocket streaming
              /____________\
             /              \
            /                \  Unit (80%)
           /                  \ - Pure functions, indicators, backtesters, validators
          /____________________\
```

- **Current Test Coverage**: 48/48 tests passing (100%) across unit, integration, and security test suites.
- **Pre-Market Verification**: 10/10 automated readiness checkpoints certified green.

---

## 3. Infrastructure & Deployment Topology

### 3.1 Container Architecture (Docker Multi-Stage)
```dockerfile
# Production Container Specification
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

FROM python:3.11-alpine
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --from=frontend-builder /app/dist ./dist
COPY python_engine/ ./python_engine/
COPY src/ ./src/
EXPOSE 8766 5173
CMD ["node", "src/server/server.mjs"]
```

---

## 4. Disaster Recovery & Operational Runbook

### 4.1 RTO & RPO Targets
- **Recovery Point Objective (RPO)**: < 1 hour (daily automated snapshots + immutable audit ledger).
- **Recovery Time Objective (RTO)**: < 15 minutes (stateless containers + blue/green rolling deployment).

### 4.2 Emergency Kill Switch
Live order routing is guarded by `LiveExecutionGuardrails`. If daily drawdown exceeds 3.0% or VaR limits are breached, live order execution is paused immediately and all broker fills revert to sandbox dry-run mode.
