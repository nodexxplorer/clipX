from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import jwt
from passlib.context import CryptContext
import os
import logging
import uuid
import hashlib
from dotenv import load_dotenv

logger = logging.getLogger("clipx")

load_dotenv()

# JWT Configuration — MUST be set in .env, no fallback
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET environment variable is not set. Server cannot start without it.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Short-lived access tokens
REFRESH_TOKEN_EXPIRE_DAYS = 30    # Long-lived refresh tokens

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None


# === Refresh Token Rotation ===

def _hash_token(token: str) -> str:
    """SHA-256 hash a refresh token for storage (never store raw tokens)."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_refresh_token(user_id: str, family_id: str = None) -> Tuple[str, str, str]:
    """
    Create a new refresh token.
    Returns: (raw_token, token_hash, family_id)
    
    Refresh token rotation flow:
    1. On login: Create a new refresh token family (family_id = new UUID)
    2. On refresh: Create a new token in the same family, revoke the old one
    3. If a revoked token is reused: Revoke ALL tokens in that family (theft detection)
    """
    if not family_id:
        family_id = str(uuid.uuid4())
    
    token_data = {
        "sub": user_id,
        "type": "refresh",
        "family": family_id,
        "jti": str(uuid.uuid4()),  # Unique token ID
        "exp": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    }
    
    raw_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    token_hash = _hash_token(raw_token)
    
    return raw_token, token_hash, family_id


def decode_refresh_token(token: str) -> Optional[dict]:
    """Decode and validate a refresh token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except Exception:
        return None


async def store_refresh_token(db, user_id: str, token_hash: str, family_id: str,
                                device_info: str = None, ip_address: str = None):
    """Store a refresh token hash in the database."""
    from sqlalchemy import text
    
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    await db.execute(text("""
        INSERT INTO refresh_tokens (user_id, token_hash, family_id, device_info, ip_address, expires_at)
        VALUES (:user_id, :token_hash, :family_id, :device_info, :ip_address, :expires_at)
    """), {
        "user_id": user_id,
        "token_hash": token_hash,
        "family_id": family_id,
        "device_info": device_info,
        "ip_address": ip_address,
        "expires_at": expires_at,
    })
    await db.commit()


async def rotate_refresh_token(db, old_token: str, device_info: str = None, ip_address: str = None):
    """
    Rotate a refresh token:
    1. Validate old token
    2. Check it's not revoked (theft detection)
    3. Revoke old token
    4. Issue new token in same family
    
    Returns: (new_access_token, new_refresh_token) or (None, None) on failure
    """
    from sqlalchemy import text
    
    payload = decode_refresh_token(old_token)
    if not payload:
        return None, None
    
    user_id = payload.get("sub")
    family_id = payload.get("family")
    old_hash = _hash_token(old_token)
    
    # Check if token exists and is not revoked
    result = await db.execute(text("""
        SELECT id, is_revoked FROM refresh_tokens
        WHERE token_hash = :hash AND user_id = :uid
    """), {"hash": old_hash, "uid": user_id})
    
    row = result.fetchone()
    
    if not row:
        # Token not found in DB — suspicious
        return None, None
    
    if row.is_revoked:
        # THEFT DETECTED: A revoked token was reused!
        # Revoke ALL tokens in this family
        await db.execute(text("""
            UPDATE refresh_tokens SET is_revoked = TRUE
            WHERE family_id = :fid
        """), {"fid": family_id})
        await db.commit()
        logger.critical(f"Refresh token theft detected for user {user_id}! All tokens in family {family_id} revoked.")
        try:
            import sentry_sdk
            sentry_sdk.capture_message(
                f"Refresh token theft detected for user {user_id}",
                level="error",
            )
        except Exception:
            pass
        return None, None
    
    # Revoke old token
    await db.execute(text("""
        UPDATE refresh_tokens SET is_revoked = TRUE
        WHERE id = :id
    """), {"id": str(row.id)})
    
    # Create new token in same family
    new_refresh, new_hash, _ = create_refresh_token(user_id, family_id)
    await store_refresh_token(db, user_id, new_hash, family_id, device_info, ip_address)
    
    # Create new access token
    new_access = create_access_token({"sub": user_id})
    
    return new_access, new_refresh


async def revoke_all_user_tokens(db, user_id: str):
    """Revoke all refresh tokens for a user (e.g., on password change or force logout)."""
    from sqlalchemy import text
    
    await db.execute(text("""
        UPDATE refresh_tokens SET is_revoked = TRUE
        WHERE user_id = :uid AND is_revoked = FALSE
    """), {"uid": user_id})
    await db.commit()


# ═══════════════════════════════════════════════════════════════
# FastAPI Dependency — reusable auth guard for REST endpoints
# ═══════════════════════════════════════════════════════════════

async def get_current_user(request=None, *, _request=None):
    """
    FastAPI Depends() callable.
    Extracts the JWT from cookie ('auth_token') or Authorization header,
    decodes it, fetches the User row, and returns the ORM object.
    Raises HTTPException(401) on any failure.

    Usage:
        from app.core.auth import get_current_user
        @router.get("/protected")
        async def protected(user=Depends(get_current_user)):
            ...
    """
    from fastapi import Request as _Req
    # Support being called as Depends(get_current_user) where FastAPI
    # injects `request` via the parameter name.
    # We also accept an explicit _request kwarg for manual calls.
    req = request or _request

    from fastapi import HTTPException

    if req is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Extract token from cookie or Authorization header
    token = None
    if hasattr(req, "cookies"):
        token = req.cookies.get("auth_token")
    auth_header = req.headers.get("authorization", "")
    if not token and auth_header.startswith("Bearer "):
        token = auth_header[7:]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id_str = payload["sub"]
    try:
        user_uuid = uuid.UUID(user_id_str)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=401, detail="Malformed token")

    from app.core.database import AsyncSessionLocal
    from app.models.database import User
    from sqlalchemy.future import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_uuid))
        user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
