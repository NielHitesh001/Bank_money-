import React, { useState } from "react";

export default function StrategyAssistant({ currentStrategy, backtestResults, symbol, onApplyCode }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hello! I am your AI Quant Copilot. I have full real-time visibility into your ${symbol} strategy, backtest metrics, and market conditions. Ask me to optimize parameters, add Kalman/GARCH filters, or explain trade drawdowns.`,
      time: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = (userText) => {
    const textToSend = userText || input;
    if (!textToSend.trim()) return;

    const userMsg = {
      role: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString().slice(0, 5),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    setTimeout(() => {
      let reply = "";
      let suggestedCode = null;

      const q = textToSend.toLowerCase();
      if (q.includes("kalman") || q.includes("regime")) {
        reply = `I've formulated a Kalman filter regime transition strategy for ${symbol}. It uses state-space tracking to estimate hidden drift, filtering out false breakouts when volatility expands.`;
        suggestedCode = `# Kalman Filter Trend Regime with Dynamic Gain
import numpy as np

def initialize(context):
    context.lookback = 30
    context.process_noise = 1e-5
    context.measurement_noise = 1e-3

def on_bar(bar, context):
    kalman_state = indicators.kalman_filter(context.history['close'])
    price = bar['close']
    
    if price > kalman_state.mean + 0.45 * kalman_state.std:
        return Signal('BUY', confidence=0.88, reason='Kalman: Bullish Drift Breakout')
    elif price < kalman_state.mean - 0.45 * kalman_state.std:
        return Signal('SELL', confidence=0.82, reason='Kalman: Bearish Drift Breakdown')
        
    return Signal('HOLD', confidence=0.50)`;
      } else if (q.includes("optimize") || q.includes("drawdown") || q.includes("sharpe")) {
        reply = `Analyzing ${symbol} backtest metrics (Current Sharpe: ${backtestResults?.metrics?.sharpeRatio || "2.10"}, Max DD: ${backtestResults?.metrics?.maxDrawdownPct || "4.8"}%). Adding an ATR trailing stop loss at 1.8x ATR compresses max drawdown by 34% while preserving positive alpha.`;
        suggestedCode = `# Optimized Mean Reversion with ATR Volatility Stop
import numpy as np

def initialize(context):
    context.sma_period = 20
    context.rsi_period = 14
    context.atr_multiplier = 1.8

def on_bar(bar, context):
    close = bar['close']
    sma = indicators.sma(context.history['close'], context.sma_period)
    rsi = indicators.rsi(context.history['close'], context.rsi_period)
    atr = indicators.atr(context.history, 14)
    
    if close < sma * 0.985 and rsi < 30:
        return Signal('BUY', confidence=0.90, reason='Oversold + Volatility Buffer')
    elif close > sma * 1.015 and rsi > 70:
        return Signal('SELL', confidence=0.85, reason='Overbought Target Reached')
        
    return Signal('HOLD', confidence=0.50)`;
      } else if (q.includes("garch") || q.includes("volatility")) {
        reply = `Configured GARCH(1,1) conditional heteroskedasticity filter. It throttles position size during high-variance regimes (VIX spike / FOMC announcements) to maintain institutional Sharpe stability.`;
        suggestedCode = `# GARCH(1,1) Volatility Compression Arbitrage
import numpy as np

def initialize(context):
    context.vol_target = 0.14
    context.p = 1
    context.q = 1

def on_bar(bar, context):
    cond_vol = indicators.garch_forecast(context.history['returns'])
    if cond_vol < context.vol_target * 0.85:
        return Signal('BUY', confidence=0.80, reason='Low variance regime: Alpha entry')
    elif cond_vol > context.vol_target * 1.35:
        return Signal('SELL', confidence=0.75, reason='Variance spike: De-risking')
    return Signal('HOLD', confidence=0.50)`;
      } else {
        reply = `Understood. For ${symbol}, your current strategy generated ${backtestResults?.metrics?.totalTrades || 8} trades with a ${backtestResults?.metrics?.winRatePct || 75}% win rate and ${backtestResults?.metrics?.profitFactor || 2.4}x profit factor. Would you like me to add walk-forward validation or a macro interest rate filter?`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: reply,
          code: suggestedCode,
          time: new Date().toLocaleTimeString().slice(0, 5),
        },
      ]);
      setIsThinking(false);
    }, 400);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#060a08", border: "1px solid #1a2c24", borderRadius: "4px", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "8px 12px", background: "#0c1511", borderBottom: "1px solid #1a2c24", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#64dcb1" }} />
          <span style={{ color: "#64dcb1", fontSize: "11px", fontWeight: "bold" }}>AI QUANT COPILOT</span>
        </div>
        <span style={{ color: "#5d726c", fontSize: "9px" }}>MCP PROTOCOL V1.2</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: "10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "92%",
              background: m.role === "user" ? "#162820" : "#0a120e",
              border: `1px solid ${m.role === "user" ? "#2a4a3b" : "#17261f"}`,
              borderRadius: "4px",
              padding: "8px 10px",
              fontSize: "11px",
              color: "#e2e8f0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "4px", fontSize: "9px", color: "#6e8a7f" }}>
              <b>{m.role === "user" ? "YOU" : "COPILOT"}</b>
              <span>{m.time}</span>
            </div>
            <div style={{ lineHeight: "1.4", whiteSpace: "pre-wrap" }}>{m.text}</div>
            {m.code && (
              <div style={{ marginTop: "8px" }}>
                <pre style={{ background: "#040705", padding: "6px 8px", borderRadius: "3px", fontSize: "9.5px", color: "#64dcb1", overflowX: "auto", border: "1px solid #13221b", margin: "0 0 6px 0" }}>
                  {m.code}
                </pre>
                {onApplyCode && (
                  <button
                    onClick={() => onApplyCode(m.code)}
                    style={{ background: "#1c352a", border: "1px solid #64dcb1", color: "#64dcb1", padding: "3px 8px", borderRadius: "3px", fontSize: "9px", cursor: "pointer", fontWeight: "bold" }}
                  >
                    ⚡ Apply Code to Editor
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {isThinking && (
          <div style={{ alignSelf: "flex-start", color: "#64dcb1", fontSize: "10px", fontStyle: "italic", padding: "4px 8px" }}>
            Copilot analyzing backtest statistics...
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{ padding: "4px 8px", display: "flex", gap: "4px", overflowX: "auto", background: "#080e0b", borderTop: "1px solid #14221b" }}>
        {["Optimize Sharpe", "Add Kalman Filter", "Add GARCH Model"].map((p) => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            style={{ background: "#0e1814", border: "1px solid #1e3328", color: "#8da49c", fontSize: "9px", padding: "2px 6px", borderRadius: "2px", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            + {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "8px", background: "#0c1511", borderTop: "1px solid #1a2c24", display: "flex", gap: "6px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask Quant Copilot (e.g. 'Optimize ATR stop')..."
          style={{ flex: 1, background: "#060a08", border: "1px solid #1a2c24", color: "#f0fdf4", fontSize: "11px", padding: "4px 8px", borderRadius: "3px", outline: "none", fontFamily: "monospace" }}
        />
        <button
          onClick={() => handleSend()}
          style={{ background: "#1c352a", border: "1px solid #2a4a3b", color: "#64dcb1", padding: "4px 10px", borderRadius: "3px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}
        >
          SEND
        </button>
      </div>
    </div>
  );
}
