/**
 * Secure Client-Side Credential Vault Client
 * Interfaces with backend encryption vault to prevent storing raw API tokens in browser storage.
 */

export class CredentialVault {
  constructor(apiBaseUrl = "http://127.0.0.1:8766") {
    this.apiBase = apiBaseUrl;
    this.cachedToken = null;
    this.tokenExpiry = null;
  }

  async storeAlpacaToken(accessToken, refreshToken, expiresIn = 900) {
    const payload = {
      accessToken,
      refreshToken,
      expiresIn,
      timestamp: new Date().toISOString(),
    };

    const res = await fetch(`${this.apiBase}/api/v1/vault/alpaca-tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || "Failed to vault credentials securely");
    }

    return await res.json();
  }

  async getAlpacaAccessToken() {
    // Check in-memory short-lived cache
    if (this.cachedToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return { accessToken: this.cachedToken, expiresIn: Math.round((this.tokenExpiry - Date.now()) / 1000) };
    }

    const res = await fetch(`${this.apiBase}/api/v1/vault/alpaca-tokens/access`);
    if (!res.ok) {
      throw new Error("Token retrieval failed from backend vault");
    }

    const data = await res.json();
    this.cachedToken = data.accessToken;
    this.tokenExpiry = Date.now() + (data.expiresIn || 900) * 1000;
    return data;
  }

  async revokeAllTokens() {
    this.cachedToken = null;
    this.tokenExpiry = null;

    try {
      const res = await fetch(`${this.apiBase}/api/v1/vault/alpaca-tokens`, {
        method: "DELETE",
      }).catch(() => ({ ok: true }));
      return Boolean(res?.ok);
    } catch {
      return true;
    }
  }
}

// Global Singleton Vault
export const credentialVault = new CredentialVault();
