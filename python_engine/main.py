#!/usr/bin/env python3
"""
Python Quantitative Strategy Engine — JSON-RPC MCP Subprocess
Communicates with Node.js via standard I/O protocol.
"""

import sys
import json
import traceback

from engine.data_loader import DataLoader
from engine.backtester import Backtester
from engine.walk_forward import WalkForwardValidator
from engine.monte_carlo import MonteCarloSimulator
from engine.model_trainer import ModelTrainer
from engine.execution import ExecutionEngine

class PythonStrategyEngine:
    def __init__(self):
        self.data_loader = DataLoader()
        self.backtester = Backtester()
        self.walk_forward = WalkForwardValidator()
        self.monte_carlo = MonteCarloSimulator()
        self.model_trainer = ModelTrainer()
        self.execution = ExecutionEngine()

    def send_response(self, resp):
        sys.stdout.write(json.dumps(resp) + "\n")
        sys.stdout.flush()

    def handle_request(self, req):
        req_id = req.get("id")
        method = req.get("method")
        params = req.get("params", {})

        try:
            if method == "ping":
                result = {"status": "ok", "ready": True}

            elif method == "get_candles":
                symbol = params.get("symbol", "SPY")
                timeframe = params.get("timeframe", "1d")
                lookback = int(params.get("lookback_days", 90))
                candles = self.data_loader.load_candles(symbol, timeframe, lookback)
                result = {"candles": candles}

            elif method == "list_datasets":
                result = {"datasets": self.data_loader.list_datasets()}

            elif method == "run_backtest":
                symbol = params.get("symbol", "SPY")
                candles = self.data_loader.load_candles(symbol, "1d", 90)
                code = params.get("strategy_code", "")
                capital = float(params.get("initial_capital", 100000.0))
                commission = float(params.get("commission", 0.0005))
                slippage = float(params.get("slippage", 0.0002))
                preset = params.get("preset", "mean_reversion")
                result = self.backtester.run(candles, strategy_code=code, initial_capital=capital, commission=commission, slippage=slippage, preset=preset)

            elif method == "walk_forward":
                symbol = params.get("symbol", "SPY")
                candles = self.data_loader.load_candles(symbol, "1d", 120)
                code = params.get("strategy_code", "")
                folds = int(params.get("num_folds", 5))
                preset = params.get("preset", "mean_reversion")
                result = self.walk_forward.run(candles, strategy_code=code, num_folds=folds, preset=preset)

            elif method == "monte_carlo":
                trades = params.get("trades", [])
                sims = int(params.get("num_simulations", 500))
                capital = float(params.get("initial_capital", 100000.0))
                result = self.monte_carlo.run(trades, num_simulations=sims, initial_capital=capital)

            elif method == "train_model":
                model_type = params.get("model_type", "garch")
                symbol = params.get("symbol", "SPY")
                candles = self.data_loader.load_candles(symbol, "1d", 90)
                result = self.model_trainer.train(model_type, candles, params)

            elif method == "get_positions":
                result = {"positions": self.execution.get_positions()}

            elif method == "get_fills":
                result = {"fills": self.execution.get_fills()}

            else:
                result = {"error": f"Unknown method: {method}"}

            self.send_response({"jsonrpc": "2.0", "id": req_id, "result": result})

        except Exception as e:
            self.send_response({
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"message": str(e), "traceback": traceback.format_exc()}
            })

    def run(self):
        # Ready notification
        self.send_response({"jsonrpc": "2.0", "result": "ready"})

        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                req = json.loads(line)
                self.handle_request(req)
            except json.JSONDecodeError:
                self.send_response({"error": "Invalid JSON input"})

if __name__ == "__main__":
    engine = PythonStrategyEngine()
    engine.run()
