from __future__ import annotations

import hashlib
import secrets


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


def mask_token_hash(token_hash: str | None) -> str:
    if not token_hash:
        return "revoked"
    if len(token_hash) < 12:
        return token_hash
    return f"sha256:{token_hash[:8]}...{token_hash[-4:]}"


# ── Vault encryption (Fernet / AES-128-CBC + HMAC-SHA256) ─────────────────────

def _get_fernet(key: str):  # type: ignore[return]
    """Return a Fernet instance. Raises ImportError if cryptography is missing."""
    from cryptography.fernet import Fernet  # type: ignore
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_secret(plaintext: str, key: str) -> bytes:
    """Encrypt a plaintext string with Fernet and return raw ciphertext bytes."""
    f = _get_fernet(key)
    return f.encrypt(plaintext.encode("utf-8"))


def decrypt_secret(ciphertext: bytes, key: str) -> str:
    """Decrypt Fernet ciphertext bytes and return the plaintext string."""
    f = _get_fernet(key)
    return f.decrypt(ciphertext).decode("utf-8")


def mask_secret_value(plaintext: str) -> str:
    """Return a redacted preview: first 4 + dots + last 4 chars."""
    if len(plaintext) <= 8:
        return "••••••••"
    return plaintext[:4] + "••••••••" + plaintext[-4:]


def generate_vault_key() -> str:
    """Generate a new random Fernet key (for bootstrapping VAULT_ENCRYPTION_KEY)."""
    from cryptography.fernet import Fernet  # type: ignore
    return Fernet.generate_key().decode()
