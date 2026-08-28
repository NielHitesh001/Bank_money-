// API Client with automatic fallback to local memory/localStorage

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8766";

export async function checkServerHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}

export async function fetchCasesApi(fallbackCases) {
  try {
    const res = await fetch(`${API_BASE}/api/cases`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch {
    return fallbackCases;
  }
}

export async function syncCaseApi(caseItem) {
  try {
    const res = await fetch(`${API_BASE}/api/cases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(caseItem),
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function addCaseNoteApi(caseId, text) {
  try {
    const res = await fetch(`${API_BASE}/api/cases/${caseId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function logAuditEventApi(eventText) {
  try {
    await fetch(`${API_BASE}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: eventText }),
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // silently degrade to in-memory audit log
  }
}
