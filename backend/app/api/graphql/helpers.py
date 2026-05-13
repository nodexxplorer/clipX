# pyright: reportCallIssue=false, reportArgumentType=false, reportGeneralTypeIssues=false, reportReturnType=false
"""Shared helpers used across query and mutation modules."""

import logging

logger = logging.getLogger("clipx")

from app.api.graphql.types import User, UserPreferences
from app.models.database import User as DbUser


def _sentry_capture(e: Exception):
    """Safely forward exception to Sentry without crashing if SDK is absent."""
    try:
        import sentry_sdk
        sentry_sdk.capture_exception(e)
    except Exception:
        pass


def get_user_preferences(user_db: DbUser) -> UserPreferences:
    prefs_data = user_db.preferences or {}
    return UserPreferences(
        favorite_genres=prefs_data.get("favoriteGenres", []),
        theme=prefs_data.get("theme", "dark"),
        email_notifications=prefs_data.get("emailNotifications", True),
        auto_play_trailers=prefs_data.get("autoPlayTrailers", True)
    )


def create_user_response(user_db: DbUser) -> User:
    return User(
        id=str(user_db.id),
        email=user_db.email,
        name=user_db.name,
        avatar=user_db.avatar,
        bio=user_db.bio,
        role=user_db.role,
        subscriptionTier=getattr(user_db, 'subscription_tier', 'free') or 'free',
        emailVerified=getattr(user_db, 'email_verified', False) or False,
        referralCount=getattr(user_db, 'referral_count', 0) or 0,
        preferences=get_user_preferences(user_db),
        _created_at_raw=str(user_db.created_at) if getattr(user_db, 'created_at', None) else None
    )


async def _log_activity(db, user_id, action: str, info=None, success: bool = True):
    """Log a login/security event."""
    from sqlalchemy import text
    try:
        ip = "unknown"
        ua = ""
        if info and hasattr(info.context, 'request'):
            request = info.context.request
            ip = request.client.host if request.client else "unknown"
            ua = request.headers.get("user-agent", "")[:1000]
        if not user_id:
            return
        await db.execute(text("""
            INSERT INTO login_activity (user_id, action, ip_address, user_agent, success)
            VALUES (:uid, :action, :ip, :ua, :success)
        """), {"uid": user_id, "action": action, "ip": ip, "ua": ua, "success": success})
        await db.commit()
    except Exception as e:
        _sentry_capture(e)
        logger.exception("Log activity error")
