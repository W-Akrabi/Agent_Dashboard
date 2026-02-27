from __future__ import annotations

import hashlib
import secrets


def generate_agent_token() -> str:
    return secrets.token_urlsafe(32)


def hash_agent_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def mask_token_hash(token_hash: str | None) -> str:
    if not token_hash:
        return "revoked"
    if len(token_hash) < 12:
        return token_hash
    return f"sha256:{token_hash[:8]}...{token_hash[-4:]}"

