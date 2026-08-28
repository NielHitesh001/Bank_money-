import React, { useMemo, useState } from "react";
import { CENTRAL_BANKS_DATA } from "../data/centralBanksData.js";
import { PAYMENT_RAILS_DATA } from "../data/paymentRailsData.js";

export default function FxPolicyConverter() {
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [targetCurrency, setTargetCurrency] = useState("EUR");
  const [amount, setAmount] = useState(1000000);

  const availableCurrencies = useMemo(() => {
    return Array.from(new Set(CENTRAL_BANKS_DATA.map((b) => b.currency))).sort();
  }, []);

  const baseBank = useMemo(() => {
    return CENTRAL_BANKS_DATA.find((b) => b.currency === baseCurrency) || CENTRAL_BANKS_DATA[0];
  }, [baseCurrency]);

  const targetBank = useMemo(() => {
    return CENTRAL_BANKS_DATA.find((b) => b.currency === targetCurrency) || CENTRAL_BANKS_DATA[1];
  }, [targetCurrency]);

  // Rate calculation (USD-normalized FX)
  const fxCrossRate = useMemo(() => {
    if (baseCurrency === targetCurrency) return 1.0;
    // 1 base in USD = baseBank.fxUsd
    // 1 target in USD = targetBank.fxUsd
    // 1 base in target = baseBank.fxUsd / targetBank.fxUsd
    return baseBank.fxUsd / targetBank.fxUsd;
  }, [baseBank, targetBank, baseCurrency, targetCurrency]);

  const convertedAmount = useMemo(() => {
    return amount * fxCrossRate;
  }, [amount, fxCrossRate]);

  const rateDifferential = useMemo(() => {
    return +(baseBank.rate - targetBank.rate).toFixed(2);
  }, [baseBank, targetBank]);

  const annualYieldDiff = useMemo(() => {
    return Math.abs(amount * (rateDifferential / 100));
  }, [amount, rateDifferential]);

  const eligibleRails = useMemo(() => {
    return PAYMENT_RAILS_DATA.filter(
      (r) =>
        r.id === "SWIFT" ||
        r.currency.includes(baseCurrency) ||
        r.currency.includes(targetCurrency)
    );
  }, [baseCurrency, targetCurrency]);

  return (
    <section className="dashboard-panel converter-panel">
      <div className="panel-heading">
        <div className="converter-head-left">
          <span className="eyebrow">MONETARY VALUATION & CROSS-BORDER ARBITRAGE</span>
          <h2>FX & Sovereign Policy Rate Differential Calculator</h2>
        </div>
        <div className="converter-head-right">
          <span className="data-badge live">● ECB & FRED BENCHMARKS</span>
        </div>
      </div>

      <div className="converter-workbench-grid">
        <div className="converter-form-card">
          <div className="form-row">
            <label>
              <span>BASE CURRENCY</span>
              <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)}>
                {availableCurrencies.map((c) => (
                  <option key={`base-${c}`} value={c}>
                    {c} — {CENTRAL_BANKS_DATA.find((b) => b.currency === c)?.country}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="swap-btn"
              title="Swap Currencies"
              onClick={() => {
                const prev = baseCurrency;
                setBaseCurrency(targetCurrency);
                setTargetCurrency(prev);
              }}
            >
              ⇄
            </button>

            <label>
              <span>TARGET CURRENCY</span>
              <select value={targetCurrency} onChange={(e) => setTargetCurrency(e.target.value)}>
                {availableCurrencies.map((c) => (
                  <option key={`target-${c}`} value={c}>
                    {c} — {CENTRAL_BANKS_DATA.find((b) => b.currency === c)?.country}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="amount-input-row">
            <label>
              <span>PRINCIPAL AMOUNT ({baseCurrency})</span>
              <input
                type="number"
                min="1000"
                step="10000"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              />
            </label>
          </div>

          <div className="conversion-result-box">
            <span className="eyebrow">ESTIMATED CONVERSION VALUE</span>
            <div className="result-headline">
              <strong>
                {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {targetCurrency}
              </strong>
            </div>
            <small className="fx-rate-quote">
              1 {baseCurrency} = {fxCrossRate.toFixed(4)} {targetCurrency} · 1 {targetCurrency} = {(1 / fxCrossRate).toFixed(4)} {baseCurrency}
            </small>
          </div>
        </div>

        <div className="differential-card">
          <div className="card-head">
            <span className="eyebrow">POLICY CARRY & SPREAD ANALYSIS</span>
            <h3>Sovereign Rate Differential</h3>
          </div>

          <div className="banks-comparison-grid">
            <div className="bank-col">
              <span className="col-label">BASE: {baseBank.country}</span>
              <strong>{baseBank.rate.toFixed(2)}%</strong>
              <small>{baseBank.institution}</small>
              <span className="cbdc-mini-tag">{baseBank.cbdc.split(" ")[0]}</span>
            </div>

            <div className="spread-col">
              <span className="col-label">SPREAD (CARRY)</span>
              <strong className={rateDifferential >= 0 ? "positive" : "negative"}>
                {rateDifferential >= 0 ? "+" : ""}{rateDifferential}%
              </strong>
              <small>{rateDifferential >= 0 ? `${baseCurrency} yield premium` : `${targetCurrency} yield premium`}</small>
            </div>

            <div className="bank-col">
              <span className="col-label">TARGET: {targetBank.country}</span>
              <strong>{targetBank.rate.toFixed(2)}%</strong>
              <small>{targetBank.institution}</small>
              <span className="cbdc-mini-tag">{targetBank.cbdc.split(" ")[0]}</span>
            </div>
          </div>

          <div className="carry-estimate-box">
            <span>ANNUAL YIELD DIFFERENTIAL ON PRINCIPAL</span>
            <strong>
              ${annualYieldDiff.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD equivalent / yr
            </strong>
          </div>

          <div className="corridor-rails-box">
            <span className="eyebrow">ACTIVE CLEARING CORRIDORS</span>
            <div className="rails-pill-list">
              {eligibleRails.map((rail) => (
                <span key={rail.id} className="rail-pill-active" title={rail.name}>
                  {rail.id} ({rail.type.split("(")[0].trim()})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
