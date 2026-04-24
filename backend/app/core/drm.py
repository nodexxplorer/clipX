"""
DRM (Digital Rights Management) Configuration
Handles content protection for premium streaming content.

Approach:
- Uses Encrypted Media Extensions (EME) via browser
- Widevine (Google), FairPlay (Apple), PlayReady (Microsoft)
- Token-based access control for stream URLs
- Signed URLs with expiration for stream segments

For full DRM, integrate with a DRM provider like:
  - BuyDRM (KeyOS)
  - PallyCon
  - EZDRM
  - Axinom
"""

import os
import hashlib
import hmac
import time
import json
from datetime import datetime, timedelta
from urllib.parse import urlencode

_DRM_SECRET_RAW = os.getenv("DRM_SECRET_KEY")
if not _DRM_SECRET_RAW:
    raise RuntimeError(
        "DRM_SECRET_KEY environment variable is not set. "
        "DRM signing requires it. Set it in your .env file."
    )
DRM_SECRET = _DRM_SECRET_RAW
DRM_PROVIDER = os.getenv("DRM_PROVIDER", "none")  # none, widevine, fairplay


def generate_signed_url(stream_url: str, user_id: str, tier: str, expires_minutes: int = 120) -> str:
    """
    Generate a time-limited signed URL for stream access.
    Prevents URL sharing and unauthorized access.
    """
    expires = int(time.time()) + (expires_minutes * 60)
    
    # Build token data
    token_data = f"{user_id}:{tier}:{stream_url}:{expires}"
    
    signature = hmac.new(
        DRM_SECRET.encode("utf-8"),
        token_data.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()[:32]
    
    # Append auth params to URL
    separator = "&" if "?" in stream_url else "?"
    return f"{stream_url}{separator}token={signature}&expires={expires}&uid={user_id[:8]}"


def verify_stream_token(url: str, token: str, user_id: str, tier: str) -> bool:
    """Verify a signed stream URL is valid and not expired."""
    import urllib.parse
    
    parsed = urllib.parse.urlparse(url)
    params = urllib.parse.parse_qs(parsed.query)
    
    expires = int(params.get("expires", [0])[0])
    if expires < int(time.time()):
        return False  # Token expired
    
    # Reconstruct and verify signature
    base_url = url.split("?")[0]
    token_data = f"{user_id}:{tier}:{base_url}:{expires}"
    
    expected = hmac.new(
        DRM_SECRET.encode("utf-8"),
        token_data.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()[:32]
    
    return hmac.compare_digest(token, expected)


def get_drm_license_config(user_id: str, tier: str) -> dict:
    """
    Generate DRM license configuration for the video player.
    Returns config object that the frontend player uses.
    """
    if DRM_PROVIDER == "none":
        return {"drm_enabled": False}
    
    license_token = _generate_license_token(user_id, tier)
    
    config = {
        "drm_enabled": True,
        "provider": DRM_PROVIDER,
        "license_token": license_token,
    }
    
    if DRM_PROVIDER == "widevine":
        config["license_url"] = os.getenv("WIDEVINE_LICENSE_URL", "")
        config["system"] = "com.widevine.alpha"
    elif DRM_PROVIDER == "fairplay":
        config["license_url"] = os.getenv("FAIRPLAY_LICENSE_URL", "")
        config["certificate_url"] = os.getenv("FAIRPLAY_CERT_URL", "")
        config["system"] = "com.apple.fps"
    elif DRM_PROVIDER == "playready":
        config["license_url"] = os.getenv("PLAYREADY_LICENSE_URL", "")
        config["system"] = "com.microsoft.playready"
    
    return config


def _generate_license_token(user_id: str, tier: str) -> str:
    """Generate a short-lived token for DRM license requests."""
    data = {
        "uid": user_id,
        "tier": tier,
        "exp": int(time.time()) + 3600,  # 1 hour
    }
    
    payload = json.dumps(data, sort_keys=True)
    
    sig = hmac.new(
        DRM_SECRET.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()[:16]
    
    import base64
    encoded = base64.urlsafe_b64encode(payload.encode("utf-8")).decode("utf-8")
    return f"{encoded}.{sig}"


# Content quality restrictions per tier
TIER_QUALITY_MAP = {
    "free": {
        "max_resolution": "480p",
        "max_bitrate": 1500,      # kbps
        "allow_download": False,
        "allow_offline": False,
        "drm_required": False,
    },
    "standard": {
        "max_resolution": "720p",
        "max_bitrate": 5000,
        "allow_download": True,
        "allow_offline": True,
        "drm_required": True,
    },
    "pro": {
        "max_resolution": "4k",
        "max_bitrate": 25000,
        "allow_download": True,
        "allow_offline": True,
        "drm_required": True,
    },
}


def get_quality_config(tier: str) -> dict:
    """Get stream quality restrictions for a subscription tier."""
    return TIER_QUALITY_MAP.get(tier, TIER_QUALITY_MAP["free"])
