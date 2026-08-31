#!/usr/bin/env python3
"""
World Money Terminal — Synthetic Graph Dataset Generator
Generates 25,000 entities + 40,000 cross-border relationship edges
with named institutions, typology signals, and realistic inter-company linkages.
"""

import json
import random
import hashlib
import os

# ─── Seeded random for reproducibility ────────────────────────────────────────
random.seed(42)

# ─── Named Anchor Institutions (appear in the existing live graph) ────────────
ANCHOR_INSTITUTIONS = [
    { "id": "JIO-IN",      "legal_name": "Jio Financial Services Ltd. (JFS)",         "jurisdiction": "IN", "entity_type": "Financial Institution", "risk_score": 22, "bic_swift": "JIOFIN88", "lei": "335800JIOFINANCIAL01" },
    { "id": "BLACKROCK-US","legal_name": "BlackRock, Inc.",                            "jurisdiction": "US", "entity_type": "Global Asset Manager",   "risk_score": 14, "bic_swift": "BLRKUS33", "lei": "549300X7FIGY46WBPJ67" },
    { "id": "JPM-US",      "legal_name": "JP Morgan Chase & Co.",                      "jurisdiction": "US", "entity_type": "Financial Institution",   "risk_score": 18, "bic_swift": "CHASUS33", "lei": "7H6GLXDRUGQFU57RNE97" },
    { "id": "SBI-IN",      "legal_name": "State Bank of India",                        "jurisdiction": "IN", "entity_type": "Financial Institution",   "risk_score": 21, "bic_swift": "SBININBB", "lei": "335800SBIFIN00012026" },
    { "id": "DB-DE",       "legal_name": "Deutsche Bank AG",                           "jurisdiction": "DE", "entity_type": "Financial Institution",   "risk_score": 31, "bic_swift": "DEUTDEFF", "lei": "7LTWFZYICNSX8D621K86" },
    { "id": "ORION-KY",    "legal_name": "Orion Capital Fund LP",                      "jurisdiction": "KY", "entity_type": "Hedge Fund / Corridor",   "risk_score": 67, "bic_swift": "ORIOKYDD", "lei": "213800ORIONFUNDLP2026" },
    { "id": "NORD-EE",     "legal_name": "Nordea Bank Abp",                            "jurisdiction": "EE", "entity_type": "Financial Institution",   "risk_score": 28, "bic_swift": "NDEAEE2X", "lei": "529900ODI3047E2LIV03" },
    { "id": "HARBOR-AE",   "legal_name": "Harbor Capital Group DIFC",                  "jurisdiction": "AE", "entity_type": "Holding Co",              "risk_score": 54, "bic_swift": "HCAPAEAD", "lei": "254900HARBORCAP2026AE" },
    { "id": "EAST-GB",     "legal_name": "East Bridge Capital Ltd.",                   "jurisdiction": "GB", "entity_type": "Asset Manager",           "risk_score": 37, "bic_swift": "EASTGB2L", "lei": "213800EASTBRIDGEGB26" },
    { "id": "TPAY-SG",     "legal_name": "TransPay Digital Pte. Ltd.",                 "jurisdiction": "SG", "entity_type": "Digital Lending",          "risk_score": 44, "bic_swift": "TPAYSGSG", "lei": "254900TPAYDIGITSG26" },
    { "id": "ICICI-IN",    "legal_name": "ICICI Bank Ltd.",                            "jurisdiction": "IN", "entity_type": "Financial Institution",   "risk_score": 19, "bic_swift": "ICICINBB", "lei": "335800ICICIBANK0001" },
    { "id": "CITI-US",     "legal_name": "Citigroup Inc.",                             "jurisdiction": "US", "entity_type": "Financial Institution",   "risk_score": 20, "bic_swift": "CITIUS33", "lei": "6SHGI4ZSSLCXXQSBB395" },
    { "id": "HSBC-GB",     "legal_name": "HSBC Holdings plc",                         "jurisdiction": "GB", "entity_type": "Financial Institution",   "risk_score": 24, "bic_swift": "MIDLGB22", "lei": "MLU0ZO3ML4LN2LL2TL37" },
    { "id": "MUFG-JP",     "legal_name": "Mitsubishi UFJ Financial Group",            "jurisdiction": "JP", "entity_type": "Financial Institution",   "risk_score": 17, "bic_swift": "BOTKJPJT", "lei": "353800EFQ3TZO12DTS19" },
    { "id": "UBS-CH",      "legal_name": "UBS Group AG",                              "jurisdiction": "CH", "entity_type": "Financial Institution",   "risk_score": 25, "bic_swift": "UBSWCHZH", "lei": "BFM8T61CT2L1QCEMIK50" },
    { "id": "VANGUARD-US", "legal_name": "The Vanguard Group Inc.",                   "jurisdiction": "US", "entity_type": "Asset Manager",           "risk_score": 12, "bic_swift": "VNGUUS33", "lei": "254900VANGUARDGRP26" },
    { "id": "GS-US",       "legal_name": "Goldman Sachs Group Inc.",                  "jurisdiction": "US", "entity_type": "Financial Institution",   "risk_score": 22, "bic_swift": "GOLSUS33", "lei": "784F5XWPLTWKTBV3E584" },
    { "id": "ABSA-ZA",     "legal_name": "Absa Group Ltd.",                           "jurisdiction": "ZA", "entity_type": "Financial Institution",   "risk_score": 33, "bic_swift": "ABSAZAJJ", "lei": "37890095OB13OG1HC237" },
    { "id": "RELIANCE-IN", "legal_name": "Reliance Industries Ltd.",                  "jurisdiction": "IN", "entity_type": "Holding Co",              "risk_score": 29, "bic_swift": "RILIBBIN", "lei": "335800RELIND00012026" },
    { "id": "BNP-FR",      "legal_name": "BNP Paribas SA",                            "jurisdiction": "FR", "entity_type": "Financial Institution",   "risk_score": 21, "bic_swift": "BNPAFRPP", "lei": "R0MUWSFPU8MPRO8K5P83" },
]

JURISDICTIONS = ['IN', 'US', 'GB', 'AE', 'DE', 'KY', 'EE', 'SG', 'HK', 'CH', 'FR', 'JP', 'CN', 'ZA', 'BR', 'CA', 'AU', 'SE', 'NL', 'LU']

ENTITY_TYPES = [
    'Financial Institution', 'Asset Manager', 'Holding Co',
    'Digital Lending', 'Corridor', 'Hedge Fund', 'Investment Bank',
    'Fintech Platform', 'Family Office', 'Special Purpose Vehicle'
]

REL_TYPES = [
    'Joint Venture Equity Injection', 'Direct Wire Transfer',
    'Parent-Subsidiary', 'Equity Holding', 'Syndicated Loan Facility',
    'Trade Finance Settlement', 'Correspondent Banking',
    'Cross-Border Remittance', 'Structured Product Issuance',
    'Acquisition / M&A Flow', 'Dividend Repatriation',
    'Escrow Release', 'Digital Asset Bridge', 'Regulatory Capital Transfer'
]

TYPOLOGY_SIGNALS = [
    None, None, None, None,   # Most entities are clean
    'Layering via SPV Chain',
    'Rapid Round-Trip Transfer',
    'High-Velocity FX Conversion',
    'Offshore Equity Injection',
    'Correspondent Banking Exposure',
    'PEP-Linked Equity Stake',
    'Sanctions-Adjacent Jurisdiction',
    'Shell Co Intermediary',
]

COMPANY_PREFIXES = [
    'Atlas', 'Summit', 'Meridian', 'Vortex', 'Nexus', 'Quantum', 'Stellar',
    'Apex', 'Pacific', 'Cardinal', 'Frontier', 'Zenith', 'Olympus', 'Terra',
    'Lyra', 'Crest', 'Solara', 'Helix', 'Mosaic', 'Pinnacle', 'Centaur',
    'Vega', 'Orion', 'Nova', 'Eclipse', 'Horizon', 'Titan', 'Aurora', 'Cobalt'
]

COMPANY_SUFFIXES = [
    'Capital Ltd.', 'Holdings Pte.', 'Asset Management AG', 'Financial Corp.',
    'Investment Group', 'Fund LP', 'Securities LLC', 'Partners LLP',
    'Equity Ltd.', 'Ventures Inc.', 'Credit SA', 'Bank plc', 'Finance DIFC',
    'Investments BV', 'Trading GmbH', 'Strategies Ltd.'
]

def gen_lei(entity_id):
    h = hashlib.md5(entity_id.encode()).hexdigest().upper()
    return f"{h[:6]}{entity_id.replace('-', '')[:12]}{random.randint(10,99)}"

def gen_swift():
    alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    digits = "0123456789"
    bank = "".join(random.choices(alpha, k=4))
    country = random.choice(JURISDICTIONS)
    loc = "".join(random.choices(alpha + digits, k=2))
    branch = "".join(random.choices(alpha + digits, k=3))
    return f"{bank}{country}{loc}{branch}"

# ─── Build nodes ──────────────────────────────────────────────────────────────
nodes = []
anchor_ids = set()

# Add anchor institutions first
for anc in ANCHOR_INSTITUTIONS:
    anc["pep_screening"] = random.choice(["Clear", "Clear", "Clear", "Flagged"])
    anc["sanctions_list"] = random.choice(["No match", "No match", "No match", "Match Found"])
    anc["typology_signal"] = random.choice([None, None, 'Jio-BlackRock JV Partner', 'Correspondent Banking Exposure'])
    nodes.append(anc)
    anchor_ids.add(anc["id"])

# Generate 24,980 synthetic entities
for i in range(1, 24981):
    entity_id = f"ENT-{i:05d}"
    country = random.choice(JURISDICTIONS)
    company_name = f"{random.choice(COMPANY_PREFIXES)} {random.choice(COMPANY_SUFFIXES)}"
    risk_score = random.randint(1, 99)
    typology = random.choice(TYPOLOGY_SIGNALS) if risk_score > 60 else None

    nodes.append({
        "id": entity_id,
        "legal_name": company_name,
        "jurisdiction": country,
        "bic_swift": gen_swift(),
        "lei": gen_lei(entity_id),
        "risk_score": risk_score,
        "entity_type": random.choice(ENTITY_TYPES),
        "pep_screening": random.choice(["Clear", "Clear", "Clear", "Flagged"]),
        "sanctions_list": random.choice(["No match", "No match", "No match", "Match Found"]),
        "typology_signal": typology,
    })

print(f"✅ Nodes generated: {len(nodes)}")

# ─── Build edges ──────────────────────────────────────────────────────────────
edges = []
anchor_list = list(anchor_ids)
all_ids = [n["id"] for n in nodes]

# 1. Anchor-to-anchor named relationships (institutional map backbone)
ANCHOR_PAIRS = [
    ("JIO-IN",      "BLACKROCK-US",  "Joint Venture Equity Injection", 300_000_000),
    ("JIO-IN",      "RELIANCE-IN",   "Parent-Subsidiary",              150_000_000),
    ("BLACKROCK-US","VANGUARD-US",   "Equity Holding",                 500_000_000),
    ("JPM-US",      "DB-DE",         "Correspondent Banking",           80_000_000),
    ("JPM-US",      "CITI-US",       "Syndicated Loan Facility",       200_000_000),
    ("SBI-IN",      "JIO-IN",        "Direct Wire Transfer",             45_000_000),
    ("SBI-IN",      "ICICI-IN",      "Correspondent Banking",           30_000_000),
    ("ORION-KY",    "HARBOR-AE",     "Offshore Equity Injection",       90_000_000),
    ("ORION-KY",    "BLACKROCK-US",  "Joint Venture Equity Injection",  60_000_000),
    ("ORION-KY",    "NORD-EE",       "Cross-Border Remittance",         22_000_000),
    ("HARBOR-AE",   "DB-DE",         "Structured Product Issuance",    110_000_000),
    ("EAST-GB",     "HSBC-GB",       "Trade Finance Settlement",         55_000_000),
    ("HSBC-GB",     "MUFG-JP",       "Correspondent Banking",           70_000_000),
    ("MUFG-JP",     "TPAY-SG",       "Digital Asset Bridge",            18_000_000),
    ("UBS-CH",      "GS-US",         "Structured Product Issuance",    250_000_000),
    ("GS-US",       "BLACKROCK-US",  "Equity Holding",                 400_000_000),
    ("BNP-FR",      "DB-DE",         "Syndicated Loan Facility",       180_000_000),
    ("BNP-FR",      "UBS-CH",        "Regulatory Capital Transfer",     95_000_000),
    ("ABSA-ZA",     "HARBOR-AE",     "Cross-Border Remittance",         14_000_000),
    ("RELIANCE-IN", "TPAY-SG",       "Joint Venture Equity Injection",  35_000_000),
    ("JPM-US",      "GS-US",         "Acquisition / M&A Flow",         320_000_000),
    ("ICICI-IN",    "TPAY-SG",       "Digital Asset Bridge",            12_000_000),
    ("CITI-US",     "BNP-FR",        "Correspondent Banking",            88_000_000),
]

for idx, (src, tgt, rel, amount) in enumerate(ANCHOR_PAIRS):
    edges.append({
        "transaction_id": f"TX-ANCHOR-{idx+1:04d}",
        "source": src,
        "target": tgt,
        "amount_usd": float(amount),
        "relationship_type": rel,
        "flagged": amount > 200_000_000,
    })

# 2. Anchor-to-synthetic entity flows (star topology for each anchor)
for anchor_id in anchor_list:
    spokes = random.sample(all_ids, 40)
    for j, spoke in enumerate(spokes):
        if spoke in anchor_ids:
            continue
        amount = round(random.uniform(5_000_000, 250_000_000), 2)
        edges.append({
            "transaction_id": f"TX-{anchor_id}-{j:04d}",
            "source": anchor_id,
            "target": spoke,
            "amount_usd": amount,
            "relationship_type": random.choice(REL_TYPES),
            "flagged": amount > 100_000_000,
        })

# 3. Synthetic entity cluster chains (layering simulation)
CLUSTER_SIZE = 8
num_clusters = 300

for c in range(num_clusters):
    cluster = random.sample(all_ids, CLUSTER_SIZE)
    for k in range(len(cluster) - 1):
        src = cluster[k]
        tgt = cluster[k + 1]
        amount = round(random.uniform(50_000, 500_000_000), 2)
        edges.append({
            "transaction_id": f"TX-CLU-{c:04d}-{k:02d}",
            "source": src,
            "target": tgt,
            "amount_usd": amount,
            "relationship_type": random.choice(REL_TYPES),
            "flagged": amount > 200_000_000,
        })

# 4. Random bulk transactions to hit target edge count
target_edges = 40000
current_count = len(edges)
for i in range(target_edges - current_count):
    source = random.choice(all_ids)
    target = random.choice(all_ids)
    if source == target:
        continue
    amount = round(random.uniform(50_000, 500_000_000), 2)
    edges.append({
        "transaction_id": f"TX-2026-{i+1:07d}",
        "source": source,
        "target": target,
        "amount_usd": amount,
        "relationship_type": random.choice(REL_TYPES),
        "flagged": amount > 200_000_000,
    })

print(f"✅ Edges generated: {len(edges)}")

# ─── Write output ──────────────────────────────────────────────────────────────
OUTPUT_PATH = "FinanceVault/_system/graph_25k.json"
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

with open(OUTPUT_PATH, "w") as f:
    json.dump({"nodes": nodes, "edges": edges}, f, separators=(',', ':'))

size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
print(f"✅ Dataset written to {OUTPUT_PATH}")
print(f"   Nodes : {len(nodes):,}")
print(f"   Edges : {len(edges):,}")
print(f"   Size  : {size_mb:.1f} MB")
