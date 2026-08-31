# ADR 005: Hybrid Node.js API Gateway & Python Quantitative Execution Subprocess

## Status: Accepted

## Context
Websocket streaming, high-concurrency client multiplexing, and REST endpoints are ideally handled by Node.js. In contrast, quantitative math (Kalman Filters, GARCH forecasting, Monte Carlo sequence permutations, Walk-Forward splits) leverages Python's scientific ecosystem.

## Decision
We implement a hybrid architecture:
1. **Node.js Gateway (`src/server/server.mjs`)**: Manages HTTP/WebSocket connections, rate limiting, and Claude MCP tool routing.
2. **Python Engine (`python_engine/main.py`)**: Runs as an isolated JSON-RPC subprocess executing algorithmic backtests and econometric models with lazy process initialization and clean fallback capabilities.

## Consequences
- **Positive**: Best-of-breed performance for both I/O networking (Node) and numerical modeling (Python).
- **Negative**: Requires robust inter-process communication protocol (`pythonBridge.js`) and process lifecycle management.
