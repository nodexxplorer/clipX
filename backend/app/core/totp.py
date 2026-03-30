"""
TOTP (Time-based One-Time Password) helper for 2FA.
Uses pyotp to generate TOTP secrets and verify codes.
"""

import pyotp
import base64
import os


def generate_totp_secret() -> str:
    """Generate a new random TOTP secret (base32 encoded)."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str, issuer: str = "clipX") -> str:
    """Generate the otpauth:// URI for QR code scanning."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=issuer)


def verify_totp_code(secret: str, code: str) -> bool:
    """Verify a 6-digit TOTP code. Allows ±1 window for clock skew."""
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)


def generate_backup_codes(count: int = 8) -> list[str]:
    """Generate one-time backup codes for 2FA recovery."""
    codes = []
    for _ in range(count):
        raw = base64.b32encode(os.urandom(5)).decode("utf-8").rstrip("=")
        codes.append(raw[:8].upper())
    return codes
