"""
Stream URL obfuscation — generates short-lived HMAC-signed tokens for stream URLs.
This prevents raw CDN URLs from being exposed in the browser's network tab.

"""

import base64
import hashlib
import hmac
import json
import os
import time

# Fail fast — no silent fallback to a known-plaintext key.
_SECRET_RAW = os.getenv("JWT_SECRET")
if not _SECRET_RAW:
    raise RuntimeError(
        "JWT_SECRET environment variable is not set. "
        "Stream token signing requires it. Set it in your .env file."
    )
_SECRET = _SECRET_RAW.encode("utf-8")

_TOKEN_TTL = 7200  # 2 hours in seconds


def create_stream_token(url: str) -> str:
    """
    Create a signed, base64url-encoded token that embeds the stream URL and
    an expiry timestamp. The full HMAC-SHA256 digest is used (32 bytes → 64
    hex chars) rather than the previous truncated 16-char version.
    """
    payload = {
        "u":   url,
        "exp": int(time.time()) + _TOKEN_TTL,
    }
    data = base64.urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":")).encode()
    ).decode()
    sig = hmac.new(_SECRET, data.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{data}.{sig}"


def resolve_stream_token(token: str) -> str | None:
    """
    Validate the HMAC signature and expiry, then return the embedded URL.
    Returns None on any failure (bad format, wrong signature, expired).
    The constant-time hmac.compare_digest prevents timing-based forgery.
    """
    try:
        parts = token.rsplit(".", 1)
        if len(parts) != 2:
            return None
        data, sig = parts

        expected = hmac.new(_SECRET, data.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None

        payload = json.loads(base64.urlsafe_b64decode(data))
        if payload.get("exp", 0) < time.time():
            return None

        return payload.get("u")
    except Exception:
        return None