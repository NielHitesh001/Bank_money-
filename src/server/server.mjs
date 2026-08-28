import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fetchMacroLiquidity, generateDeterministicFallback } from "../services/macroLiquidityService.js";
import { cases as initialCases } from "../../data/intelligenceMock.js";

// Load .env.local or .env if present
function loadEnv() {
  for (const envFile of [".env.local", ".env"]) {
    const p = path.resolve(envFile);
    if (fs.existsSync(p)) {
      const lines = fs.readFileSync(p, "utf-8").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [k, ...v] = trimmed.split("=");
        if (k && v) {
          process.env[k.trim()] = v.join("=").trim();
        }
      }
    }
  }
}
loadEnv();

const PORT = Number(process.env.PORT || 8766);
const DB_PATH = path.resolve("./FinanceVault/_system/server_db.json");
const GRAPH_EXPORT_PATH = path.resolve("./FinanceVault/_system/exports/world-money-graph.v1.json");

function initDb() {
  if (fs.existsSync(DB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    } catch {
      // ignore parse error and re-init
    }
  }

  const initialDb = {
    cases: initialCases.map((c) => ({
      ...c,
      itemIds: c.id === "CASE-1842" ? ["TX-2026-08492", "TX-2026-08493", "TX-2026-08494", "TX-2026-08495"] : [],
      notes: [],
    })),
    audit: [
      { sequence: 1, event: "09:42 — session authenticated", timestamp: new Date().toISOString() },
      { sequence: 2, event: "09:44 — trace started: Baltic routing anomaly", timestamp: new Date().toISOString() },
    ],
    triagedAlerts: [],
    savedViews: [],
  };

  saveDb(initialDb);
  return initialDb;
}

function saveDb(data) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save DB:", err.message);
  }
}

let db = initDb();

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(res, statusCode, data) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = parsedUrl.pathname;

  try {
    // 1. Health check
    if (pathname === "/api/health" && req.method === "GET") {
      sendJson(res, 200, {
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        fredApiKeyConfigured: Boolean(process.env.FRED_API_KEY && process.env.FRED_API_KEY !== "your_fred_api_key_here"),
        version: "1.1.0",
      });
      return;
    }

    // 2. Macro Liquidity Feed
    if (pathname === "/api/macro" && req.method === "GET") {
      const data = await fetchMacroLiquidity();
      sendJson(res, 200, data);
      return;
    }

    // 3. Current Graph Export
    if (pathname === "/api/graph" && req.method === "GET") {
      if (fs.existsSync(GRAPH_EXPORT_PATH)) {
        const content = fs.readFileSync(GRAPH_EXPORT_PATH, "utf-8");
        sendJson(res, 200, JSON.parse(content));
      } else {
        sendJson(res, 404, { error: "Graph export not found" });
      }
      return;
    }

    // 4. Cases API
    if (pathname === "/api/cases" && req.method === "GET") {
      sendJson(res, 200, db.cases);
      return;
    }

    if (pathname === "/api/cases" && req.method === "POST") {
      const payload = await parseJsonBody(req);
      if (payload.id) {
        const index = db.cases.findIndex((c) => c.id === payload.id);
        if (index >= 0) {
          db.cases[index] = { ...db.cases[index], ...payload, updated: "just now" };
        } else {
          db.cases.push({ ...payload, notes: payload.notes || [], updated: "just now" });
        }
        saveDb(db);
        sendJson(res, 200, { status: "saved", case: payload });
      } else {
        sendJson(res, 400, { error: "Case ID required" });
      }
      return;
    }

    // 5. Case Notes API (/api/cases/:id/notes)
    if (pathname.startsWith("/api/cases/") && pathname.endsWith("/notes") && req.method === "POST") {
      const caseId = pathname.split("/")[3];
      const payload = await parseJsonBody(req);
      const targetCase = db.cases.find((c) => c.id === caseId);
      if (targetCase) {
        const note = {
          id: `${caseId}-${Date.now()}`,
          caseId,
          text: payload.text,
          timestamp: new Date().toISOString(),
        };
        targetCase.notes = targetCase.notes || [];
        targetCase.notes.unshift(note);
        saveDb(db);
        sendJson(res, 200, { status: "note_added", note });
      } else {
        sendJson(res, 404, { error: "Case not found" });
      }
      return;
    }

    // 6. Audit Trail API
    if (pathname === "/api/audit" && req.method === "GET") {
      sendJson(res, 200, db.audit);
      return;
    }

    if (pathname === "/api/audit" && req.method === "POST") {
      const payload = await parseJsonBody(req);
      if (payload.event) {
        const entry = {
          sequence: db.audit.length + 1,
          event: payload.event,
          timestamp: new Date().toISOString(),
        };
        db.audit.unshift(entry);
        saveDb(db);
        sendJson(res, 200, { status: "logged", entry });
      } else {
        sendJson(res, 400, { error: "Event message required" });
      }
      return;
    }

    // 404 handler
    sendJson(res, 404, { error: "Endpoint not found" });
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
});

const isDirectExecution = process.argv[1] && process.argv[1].endsWith("server.mjs");

if (isDirectExecution) {
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`MoneyTrace & World Money Backend API running on http://127.0.0.1:${PORT}`);
  });
}

export { server };
