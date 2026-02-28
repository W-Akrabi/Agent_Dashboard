from __future__ import annotations

import hashlib
import secrets

import bcrypt


def generate_agent_token() -> str:
    return secrets.token_urlsafe(32)


def hash_agent_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def verify_control_plane_token(
    provided_token: str | None,
    expected_token: str,
) -> bool:
    if not provided_token:
        return False
    return secrets.compare_digest(provided_token, expected_token)


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def mask_token_hash(token_hash: str | None) -> str:
    if not token_hash:
        return "revoked"
    if len(token_hash) < 12:
        return token_hash
    return f"sha256:{token_hash[:8]}...{token_hash[-4:]}"
