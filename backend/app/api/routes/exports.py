# backend/app/api/routes/exports.py
"""
REST endpoints for data exports (CSV downloads).
These are separate from GraphQL because they return binary file responses.
"""

import csv
import io
import logging
from datetime import datetime

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

logger = logging.getLogger("clipx")

router = APIRouter()


async def _get_admin_user(request: Request):
    """Validate the request has admin auth and return the user."""
    from app.core.auth import decode_access_token
    from app.core.database import AsyncSessionLocal
    from app.models.database import User
    from sqlalchemy.future import select
    import uuid

    token = request.cookies.get("auth_token")
    auth_header = request.headers.get("authorization", "")
    if not token and auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        user_id = uuid.UUID(payload["sub"])
    except (ValueError, AttributeError):
        raise HTTPException(status_code=401, detail="Malformed token")

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    return user


@router.get("/exports/revenue.csv")
async def export_revenue_csv(request: Request, days: int = 90):
    """
    Download revenue data as a CSV file.
    Query params:
      - days: number of days to include (default 90)
    """
    await _get_admin_user(request)

    from app.core.database import AsyncSessionLocal
    from sqlalchemy import text

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(text("""
                SELECT ph.id, u.email, ph.amount, ph.currency, ph.plan,
                       ph.status, ph.payment_method, ph.paid_at, ph.created_at,
                       ph.paystack_reference
                FROM payment_history ph
                LEFT JOIN users u ON u.id = ph.user_id
                WHERE ph.created_at >= NOW() - MAKE_INTERVAL(days => :days)
                ORDER BY ph.created_at DESC
            """), {"days": days})
            rows = result.fetchall()
        except Exception as e:
            # Table might not exist yet
            logger.exception("[revenue export] Error")
            try:
                import sentry_sdk
                sentry_sdk.capture_exception(e)
            except Exception:
                pass
            rows = []

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Transaction ID", "Email", "Amount (Kobo)", "Currency", "Plan",
        "Status", "Payment Method", "Paid At", "Created At", "Paystack Reference"
    ])
    for r in rows:
        writer.writerow([
            str(r[0]), r[1] or "", r[2] or 0, r[3] or "NGN", r[4] or "",
            r[5] or "", r[6] or "", str(r[7]) if r[7] else "",
            str(r[8]) if r[8] else "", r[9] or ""
        ])

    output.seek(0)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"clipx_revenue_{timestamp}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/exports/users.csv")
async def export_users_csv(request: Request):
    """Download user data as a CSV file (admin only)."""
    await _get_admin_user(request)

    from app.core.database import AsyncSessionLocal
    from sqlalchemy import text

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(text("""
                SELECT id, email, name, role, subscription_tier,
                       email_verified, referral_count, created_at, last_active
                FROM users
                ORDER BY created_at DESC
            """))
            rows = result.fetchall()
        except Exception as e:
            logger.exception("[users export] Error")
            try:
                import sentry_sdk
                sentry_sdk.capture_exception(e)
            except Exception:
                pass
            rows = []

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "User ID", "Email", "Name", "Role", "Subscription Tier",
        "Email Verified", "Referral Count", "Created At", "Last Active"
    ])
    for r in rows:
        writer.writerow([
            str(r[0]), r[1] or "", r[2] or "", r[3] or "user", r[4] or "free",
            "Yes" if r[5] else "No", r[6] or 0,
            str(r[7]) if r[7] else "", str(r[8]) if r[8] else ""
        ])

    output.seek(0)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"clipx_users_{timestamp}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
