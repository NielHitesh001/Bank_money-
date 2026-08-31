"""
Monte Carlo Permutation & Risk-of-Ruin Engine
Simulates hundreds of alternate trade execution sequence paths to compute tail-risk percentiles.
"""

import random

class MonteCarloSimulator:
    def __init__(self):
        pass

    def run(self, trades, num_simulations=500, initial_capital=100000.0):
        if not trades:
            # Generate synthetic baseline trades if empty
            pnls = [350, -180, 520, 210, -320, 680, -150, 440, 310, -220, 850, -410]
        else:
            pnls = [t['pnl'] for t in trades]

        max_drawdowns = []
        final_equities = []
        ruin_count = 0
        ruin_threshold = initial_capital * 0.50 # 50% loss threshold

        for _ in range(num_simulations):
            shuffled = list(pnls)
            random.shuffle(shuffled)

            equity = initial_capital
            peak = initial_capital
            max_dd = 0.0

            for pnl in shuffled:
                equity += pnl
                if equity > peak:
                    peak = equity
                dd = (peak - equity) / peak
                if dd > max_dd:
                    max_dd = dd

            if equity < ruin_threshold:
                ruin_count += 1

            max_drawdowns.append(max_dd)
            final_equities.append(equity)

        max_drawdowns.sort()
        final_equities.sort()

        p50_dd = max_drawdowns[int(num_simulations * 0.50)] * 100.0
        p95_dd = max_drawdowns[int(num_simulations * 0.95)] * 100.0
        p99_dd = max_drawdowns[int(num_simulations * 0.99)] * 100.0

        p50_eq = final_equities[int(num_simulations * 0.50)]
        p95_eq = final_equities[int(num_simulations * 0.05)] # 5th percentile worst equity

        risk_of_ruin = round((ruin_count / num_simulations) * 100.0, 2)

        return {
            "numSimulations": num_simulations,
            "medianDrawdownPct": round(p50_dd, 2),
            "p95DrawdownPct": round(p95_dd, 2),
            "p99DrawdownPct": round(p99_dd, 2),
            "medianFinalEquity": round(p50_eq, 2),
            "worst5thPercentileEquity": round(p95_eq, 2),
            "riskOfRuinPct": risk_of_ruin,
            "riskAssessment": "INSTITUTIONAL SAFE" if p95_dd < 20 and risk_of_ruin < 1.0 else "ELEVATED VOLATILITY"
        }
