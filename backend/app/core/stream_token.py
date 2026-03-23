"""
Stream URL obfuscation — generates short-lived signed tokens for stream URLs.
This prevents raw CDN URLs from being exposed in the browser's network tab.
"""

import base64
import hashlib
import hmac
import json
import time
import os

# Use JWT secret or a dedicated key
_SECRET = os.getenv("JWT_SECRET", "clipx-stream-secret-key").encode()
_TOKEN_TTL = 7200  # 2 hours


def create_stream_token(url: str) -> str:
    """Create a signed, base64-encoded token containing the stream URL."""
    payload = {
        "u": url,
        "exp": int(time.time()) + _TOKEN_TTL,
    }
    data = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    sig = hmac.new(_SECRET, data.encode(), hashlib.sha256).hexdigest()[:16]
    return f"{data}.{sig}"


def resolve_stream_token(token: str) -> str | None:
    """Validate token signature and expiry, return the original URL or None."""
    try:
        parts = token.rsplit(".", 1)
        if len(parts) != 2:
            return None
        data, sig = parts
        expected_sig = hmac.new(_SECRET, data.encode(), hashlib.sha256).hexdigest()[:16]
        if not hmac.compare_digest(sig, expected_sig):
            return None
        payload = json.loads(base64.urlsafe_b64decode(data))
        if payload.get("exp", 0) < time.time():
            return None
        return payload.get("u")
    except Exception:
        return None
