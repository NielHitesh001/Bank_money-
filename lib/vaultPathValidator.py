"""
Vault Path Security Validator & Traversal Prevention Module
"""

import re
from pathlib import Path
from typing import Union

class VaultPathValidator:
    """Whitelist vault paths and reject path traversal attacks."""

    PATH_PATTERN = re.compile(r"^[a-zA-Z0-9_\-\.]+$")

    @classmethod
    def validate_vault_id(cls, vault_id: str) -> bool:
        """Reject traversal patterns: ../../etc/passwd, /etc/passwd, $(whoami)"""
        if not vault_id or not isinstance(vault_id, str):
            raise ValueError(f"Invalid vault_id type: {type(vault_id)}")
        if ".." in vault_id or "/" in vault_id or "\\" in vault_id:
            raise ValueError(f"Path traversal detected in vault identifier: {vault_id}")
        if not cls.PATH_PATTERN.match(vault_id):
            raise ValueError(f"Disallowed characters in vault identifier: {vault_id}")
        return True

    @classmethod
    def secure_vault_path(cls, root_dir: Union[str, Path], vault_id: str) -> Path:
        """Build path safely, ensuring no escape from allowed root directory."""
        cls.validate_vault_id(vault_id)
        root = Path(root_dir).resolve()
        target = (root / vault_id).resolve()

        # Enforce boundary confinement
        try:
            target.relative_to(root)
        except ValueError:
            raise PermissionError(f"Path traversal detected: {vault_id} resolves outside root {root}")

        return target
