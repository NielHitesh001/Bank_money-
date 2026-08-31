"""
Role-Based Access Control (RBAC) Module for Python Daemon & Endpoints
"""

from enum import Enum
from typing import Set, Dict, Any
import datetime
import logging

class Role(str, Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    TRADER = "trader"
    COMPLIANCE = "compliance"
    GUEST = "guest"

class Permission(str, Enum):
    VAULT_READ = "vault:read"
    VAULT_WRITE = "vault:write"
    VAULT_DELETE = "vault:delete"
    AUDIT_READ = "audit:read"
    AUDIT_LOG = "audit:log"
    TRADE_EXECUTE = "trade:execute"
    POSITIONS_WRITE = "positions:write"
    EXPORT_DATA = "export:data"
    USER_MANAGE = "user:manage"
    SETTINGS_WRITE = "settings:write"

ROLE_PERMISSIONS: Dict[Role, Set[Permission]] = {
    Role.ADMIN: {
        Permission.VAULT_READ,
        Permission.VAULT_WRITE,
        Permission.VAULT_DELETE,
        Permission.AUDIT_READ,
        Permission.AUDIT_LOG,
        Permission.TRADE_EXECUTE,
        Permission.POSITIONS_WRITE,
        Permission.EXPORT_DATA,
        Permission.USER_MANAGE,
        Permission.SETTINGS_WRITE,
    },
    Role.ANALYST: {
        Permission.VAULT_READ,
        Permission.AUDIT_READ,
        Permission.EXPORT_DATA,
    },
    Role.TRADER: {
        Permission.VAULT_READ,
        Permission.TRADE_EXECUTE,
        Permission.POSITIONS_WRITE,
        Permission.EXPORT_DATA,
    },
    Role.COMPLIANCE: {
        Permission.VAULT_READ,
        Permission.AUDIT_READ,
        Permission.AUDIT_LOG,
        Permission.EXPORT_DATA,
    },
    Role.GUEST: {
        Permission.VAULT_READ,
    },
}

class AuthorizationManager:
    """Enforces RBAC and maintains structured access audits."""

    @staticmethod
    def has_permission(role: Role, permission: Permission) -> bool:
        return permission in ROLE_PERMISSIONS.get(role, set())

    @staticmethod
    def audit_access(user_id: str, action: str, resource: str, permitted: bool) -> None:
        logger = logging.getLogger("rbac_audit")
        logger.info(
            f"timestamp={datetime.datetime.now(datetime.timezone.utc).isoformat()} "
            f"user_id={user_id} action={action} resource={resource} permitted={permitted}"
        )
