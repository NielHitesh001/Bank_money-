/**
 * Vault Path Security Validator (ESM)
 * Prevents directory traversal attacks in Node.js endpoints and file handlers.
 */

import path from 'node:path';

const PATH_PATTERN = /^[a-zA-Z0-9_\-\.]+$/;

export class VaultPathValidator {
  static validateVaultId(vaultId) {
    if (!vaultId || typeof vaultId !== 'string') {
      throw new TypeError(`Invalid vaultId: ${vaultId}`);
    }
    if (vaultId.includes('..') || vaultId.includes('/') || vaultId.includes('\\')) {
      throw new Error(`Path traversal sequence detected in vault identifier: ${vaultId}`);
    }
    if (!PATH_PATTERN.test(vaultId)) {
      throw new Error(`Disallowed characters in vault identifier: ${vaultId}`);
    }
    return true;
  }

  static secureVaultPath(rootDir, vaultId) {
    this.validateVaultId(vaultId);
    const resolvedRoot = path.resolve(rootDir);
    const targetPath = path.resolve(resolvedRoot, vaultId);

    if (!targetPath.startsWith(resolvedRoot)) {
      throw new Error(`Access Denied: Path escapes permitted root ${resolvedRoot}`);
    }
    return targetPath;
  }
}
