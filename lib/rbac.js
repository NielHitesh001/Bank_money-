/**
 * Role-Based Access Control (RBAC) Matrix & Permission Middleware
 * Enforces least privilege across Admin, Analyst, Trader, Compliance, and Guest roles.
 */

export const ROLES = {
  ADMIN: 'admin',
  ANALYST: 'analyst',
  TRADER: 'trader',
  COMPLIANCE: 'compliance',
  GUEST: 'guest',
};

export const PERMISSIONS = {
  VAULT_READ: 'vault:read',
  VAULT_WRITE: 'vault:write',
  VAULT_DELETE: 'vault:delete',
  AUDIT_READ: 'audit:read',
  AUDIT_LOG: 'audit:log',
  TRADE_EXECUTE: 'trade:execute',
  POSITIONS_WRITE: 'positions:write',
  EXPORT_DATA: 'export:data',
  USER_MANAGE: 'user:manage',
  SETTINGS_WRITE: 'settings:write',
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.VAULT_READ,
    PERMISSIONS.VAULT_WRITE,
    PERMISSIONS.VAULT_DELETE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.AUDIT_LOG,
    PERMISSIONS.TRADE_EXECUTE,
    PERMISSIONS.POSITIONS_WRITE,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.SETTINGS_WRITE,
  ],
  [ROLES.ANALYST]: [
    PERMISSIONS.VAULT_READ,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.EXPORT_DATA,
  ],
  [ROLES.TRADER]: [
    PERMISSIONS.VAULT_READ,
    PERMISSIONS.TRADE_EXECUTE,
    PERMISSIONS.POSITIONS_WRITE,
    PERMISSIONS.EXPORT_DATA,
  ],
  [ROLES.COMPLIANCE]: [
    PERMISSIONS.VAULT_READ,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.AUDIT_LOG,
    PERMISSIONS.EXPORT_DATA,
  ],
  [ROLES.GUEST]: [
    PERMISSIONS.VAULT_READ,
  ],
};

export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  const permissions = ROLE_PERMISSIONS[role.toLowerCase()] || [];
  return permissions.includes(permission);
}

export function createAuthMiddleware(requiredPermission) {
  return (req, res, next) => {
    const role = req.headers['x-user-role'] || (req.user && req.user.role) || ROLES.GUEST;
    if (!hasPermission(role, requiredPermission)) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient permissions',
        requiredPermission,
        userRole: role,
      });
    }
    next();
  };
}
