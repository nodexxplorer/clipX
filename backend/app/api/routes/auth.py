# backend/app/api/routes/auth.py


import os
import hmac
import hashlib
import json
import time

from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()

# ─── shared helpers ────────────────────────────────────────────────────────

def _is_production() -> bool:
    return os.getenv("ENV", "development") == "production"


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Apply both httpOnly cookies with consistent flags."""
    prod = _is_production()
    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=True,
        secure=prod,
        samesite="lax",
        max_age=60 * 15,           # 15 minutes
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=prod,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,  # 30 days
        path="/api/auth/refresh",   # scoped — only sent to this endpoint
    )


# ─── POST /api/auth/refresh ────────────────────────────────────────────────

@router.post("/auth/refresh")
async def refresh_token_endpoint(request: Request) -> JSONResponse:
    """
    Rotate the refresh token and issue a new access token.

    Flow:
      1. Read the refresh_token httpOnly cookie.
      2. Call rotate_refresh_token() — this validates, revokes old, issues new.
         If a revoked token is replayed, ALL tokens in the family are revoked
         (theft detection built into auth.py).
      3. Set fresh auth_token and refresh_token cookies.
      4. Return { "ok": true } — the client never needs to read the tokens.
    """
    old_refresh = request.cookies.get("refresh_token")
    if not old_refresh:
        raise HTTPException(status_code=401, detail="No refresh token present")

    from app.core.database import AsyncSessionLocal
    from app.core.auth import rotate_refresh_token

    device_info = (request.headers.get("user-agent") or "")[:255]
    ip_address  = request.client.host if request.client else None

    async with AsyncSessionLocal() as db:
        new_access, new_refresh = await rotate_refresh_token(
            db, old_refresh, device_info=device_info, ip_address=ip_address
        )

    if not new_access or not new_refresh:
        # Token not found, revoked, or theft detected — clear cookies
        response = JSONResponse(
            status_code=401,
            content={"ok": False, "detail": "Session expired. Please log in again."}
        )
        response.delete_cookie("auth_token",    path="/")
        response.delete_cookie("refresh_token", path="/api/auth/refresh")
        return response

    response = JSONResponse(content={"ok": True})
    _set_auth_cookies(response, new_access, new_refresh)
    return response


# ─── POST /api/ws-ticket ───────────────────────────────────────────────────

# Ticket secret — use JWT_SECRET so no new env var is needed
_WS_SECRET_RAW = os.getenv("JWT_SECRET")
if not _WS_SECRET_RAW:
    raise RuntimeError("JWT_SECRET must be set — required for WebSocket ticket signing")
_WS_SECRET = _WS_SECRET_RAW.encode("utf-8")
_WS_TICKET_TTL = 60  # seconds — single-use, very short-lived


def _sign_ticket(payload: dict) -> str:
    data = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    sig = hmac.new(_WS_SECRET, data.encode(), hashlib.sha256).hexdigest()
    import base64
    encoded = base64.urlsafe_b64encode(data.encode()).decode()
    return f"{encoded}.{sig}"


def verify_ws_ticket(ticket: str) -> dict | None:
    """
    Called by chat.py on WebSocket connect to validate the ticket.
    Returns the payload dict (containing user_id, name, avatar) or None.
    """
    try:
        import base64
        parts = ticket.rsplit(".", 1)
        if len(parts) != 2:
            return None
        encoded, sig = parts
        data = base64.urlsafe_b64decode(encoded).decode()
        expected = hmac.new(_WS_SECRET, data.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(data)
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


@router.post("/auth/ws-ticket")
async def ws_ticket_endpoint(request: Request) -> JSONResponse:
    """
    Issue a short-lived (60 s) signed ticket for WebSocket authentication.

    The browser cannot attach httpOnly cookies to WebSocket handshake headers,
    so the frontend calls this REST endpoint (which does receive the auth_token
    cookie), and receives a one-time ticket to pass as ?ticket= on the WS URL.

    The ticket is signed with HMAC-SHA256 and expires after 60 seconds.
    """
    # Validate the auth_token cookie via context helpers
    from app.core.auth import decode_access_token
    from app.core.database import AsyncSessionLocal
    from app.models.database import User
    from sqlalchemy.future import select
    import uuid as _uuid

    token = request.cookies.get("auth_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        user_id = _uuid.UUID(payload["sub"])
    except (ValueError, AttributeError):
        raise HTTPException(status_code=401, detail="Malformed token")

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    ticket_payload = {
        "user_id": str(user.id),
        "name":    user.name or "Anonymous",
        "avatar":  user.avatar or None,
        "exp":     int(time.time()) + _WS_TICKET_TTL,
    }
    ticket = _sign_ticket(ticket_payload)
    return JSONResponse(content={"ticket": ticket})