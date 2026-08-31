# PILOT EVALUATION LETTER OF INTENT (LOI)
## World Money Institutional Software Evaluation Agreement

**Effective Date**: [Start Date, e.g., September 15, 2026]  
**Company / Participant**: [Institution Name, e.g., Wise Payments Ltd. / JPMorgan Chase]  
**Provider**: World Money Terminal Infrastructure ("Provider")

---

### 1. Purpose & Scope of Pilot
The Participant agrees to participate in a **two (2) week evaluation pilot** of the World Money Terminal platform for the purpose of assessing real-time liquidity visibility, payment rail health monitoring, and corridor status telemetry.

- **Covered Corridors**: Top three (3) high-volume settlement corridors agreed upon by parties:
  1. Corridor 1: `USD -> INR`
  2. Corridor 2: `EUR -> BRL`
  3. Corridor 3: `GBP -> MXN`
- **Provided Access**: Web-based dedicated terminal workspace, WebSocket/REST API data access, and immutable SHA-256 compliance audit ledger.

---

### 2. Pilot Performance SLA & Success Metrics
The pilot evaluation shall be judged against the following objective criteria:
1. **Sub-Second Latency**: Corridor status queries resolved with $< 500\text{ms}$ P99 latency.
2. **Alert Freshness**: Corridor disruption/maintenance notifications delivered $< 5.0\text{s}$ from source event.
3. **Data Accuracy**: $> 95.0\%$ status alignment against participant clearing logs.
4. **Availability**: $> 99.0\%$ platform and API availability during pilot duration.

---

### 3. Commercial Terms & Non-Custodial Assurances
- **Pilot Fee**: **\$0.00 (Zero Fee)**. Provider assumes all infrastructure, hosting, and data aggregation costs for the 2-week duration.
- **Non-Custodial Architecture**: The World Money platform operates strictly as a financial intelligence data vendor. The platform does not hold, custody, or transmit participant or client funds.
- **Confidentiality & Data Ownership**: Participant retains 100% ownership of internal routing logs. All participant telemetry is encrypted in transit (TLS 1.3) and at rest (AES-256) and purged within 90 days following pilot completion unless otherwise agreed.

---

### 4. Post-Pilot Commercial Transition
At the conclusion of the 2-week pilot, parties will hold a mutual evaluation review. Upon successful achievement of Section 2 SLAs, Participant and Provider may transition to a standard production subscription agreement (commencing at \$5,000–\$25,000/month based on corridor volume).

---

### Signatures & Authorization

**For Participant:**  
Name: _______________________________  
Title: _______________________________  
Date: _______________________________  

**For World Money Provider:**  
Name: Neel Hitesh  
Title: Founder & Principal Architect  
Date: _______________________________  
