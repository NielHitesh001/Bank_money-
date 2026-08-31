"""
Broker Interface & Trade Execution Engine
Coordinates order routing and fill reconciliations.
"""

class ExecutionEngine:
    def __init__(self, mode="paper"):
        self.mode = mode

    def get_positions(self):
        return [
            {"symbol": "SPY", "units": 15, "entryPrice": 580.25, "marketPrice": 580.80, "unrealizedPnl": 8.25},
            {"symbol": "EURUSD", "units": 10000, "entryPrice": 1.0850, "marketPrice": 1.0874, "unrealizedPnl": 24.00}
        ]

    def get_fills(self):
        return [
            {"id": "FILL-901", "symbol": "SPY", "side": "BUY", "units": 15, "fillPrice": 580.25, "venue": "ALPACA_PAPER"},
            {"id": "FILL-902", "symbol": "EURUSD", "side": "BUY", "units": 10000, "fillPrice": 1.0850, "venue": "ALPACA_PAPER"}
        ]
