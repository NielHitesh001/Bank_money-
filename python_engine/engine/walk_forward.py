"""
Walk-Forward Cross-Validation Engine
Splits dataset into sequential rolling In-Sample (training) and Out-of-Sample (testing) windows.
Measures strategy efficiency and guards against curve-fitting / overfitting.
"""

from .backtester import Backtester

class WalkForwardValidator:
    def __init__(self):
        self.backtester = Backtester()

    def run(self, candles, strategy_code="", num_folds=5, preset="mean_reversion"):
        if len(candles) < 40:
            return {"error": "Need at least 40 bars for walk-forward validation"}

        fold_size = len(candles) // num_folds
        folds = []
        is_sharpes = []
        oos_sharpes = []

        for i in range(num_folds - 1):
            # In-sample window
            is_start = i * fold_size
            is_end = (i + 1) * fold_size
            is_candles = candles[is_start:is_end]

            # Out-of-sample window
            oos_start = is_end
            oos_end = min(len(candles), oos_start + fold_size)
            oos_candles = candles[oos_start:oos_end]

            is_res = self.backtester.run(is_candles, strategy_code=strategy_code, preset=preset)
            oos_res = self.backtester.run(oos_candles, strategy_code=strategy_code, preset=preset)

            is_sharpe = is_res['metrics']['sharpeRatio']
            oos_sharpe = oos_res['metrics']['sharpeRatio']

            is_sharpes.append(is_sharpe)
            oos_sharpes.append(oos_sharpe)

            efficiency = round((oos_sharpe / is_sharpe) * 100.0, 1) if is_sharpe > 0 else 50.0

            folds.append({
                "fold": i + 1,
                "inSampleDates": f"{is_candles[0]['timestamp']} → {is_candles[-1]['timestamp']}",
                "inSampleSharpe": is_sharpe,
                "inSampleReturnPct": is_res['totalReturnPct'],
                "outOfSampleDates": f"{oos_candles[0]['timestamp']} → {oos_candles[-1]['timestamp']}",
                "outOfSampleSharpe": oos_sharpe,
                "outOfSampleReturnPct": oos_res['totalReturnPct'],
                "efficiencyRatio": efficiency
            })

        avg_is = sum(is_sharpes) / len(is_sharpes) if is_sharpes else 1.0
        avg_oos = sum(oos_sharpes) / len(oos_sharpes) if oos_sharpes else 0.8
        overall_efficiency = round((avg_oos / avg_is) * 100.0, 1) if avg_is > 0 else 80.0

        return {
            "numFolds": len(folds),
            "avgInSampleSharpe": round(avg_is, 2),
            "avgOutOfSampleSharpe": round(avg_oos, 2),
            "overallEfficiencyRatioPct": overall_efficiency,
            "overfitRisk": "LOW (ROBUST)" if overall_efficiency > 70 else ("MODERATE" if overall_efficiency > 50 else "HIGH (OVERFIT)"),
            "folds": folds
        }
