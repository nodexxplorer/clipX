# pyright: reportCallIssue=false, reportArgumentType=false, reportGeneralTypeIssues=false, reportReturnType=false
"""Auth mutations: login, register, googleAuth, logout, refresh, password, verify."""

import strawberry
import os
import secrets
from typing import List, Optional
from datetime import datetime, timedelta

from sqlalchemy.future import select

from app.services.notification_service import notification_service
from app.core.auth import verify_password, get_password_hash, create_access_token, decode_access_token
from app.models.database import (
    User as DbUser, PasswordResetToken as DbPasswordResetToken,
)
from app.api.graphql.types import (
    AuthResponse, GoogleAuthResponse, SuccessResponse, RegisterInput, User,
)
from app.api.graphql.helpers import _sentry_capture, create_user_response, _log_activity, logger
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


@strawberry.type
class AuthMutations:

    @strawberry.mutation
    async def login(self, info: strawberry.Info, email: str, password: str) -> AuthResponse:
        from app.core.database import AsyncSessionLocal
        from app.core.auth import verify_password, create_access_token
        import os
        async with AsyncSessionLocal() as db:
            try:
                result = await db.execute(select(DbUser).where(DbUser.email == email))
                user = result.scalars().first()
            except Exception as e:
                logger.exception("[LOGIN] DB error")
                _sentry_capture(e)
                raise Exception("Login service temporarily unavailable. Please try again.")

            if not user:
                await _log_activity(db, None, "login_failed", info, success=False)
                raise Exception("Invalid email or password")
            # ΓöÇΓöÇ Ban enforcement ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
            if getattr(user, 'is_banned', False):
                await _log_activity(db, str(user.id), "login_banned", info, success=False)
                raise Exception("Account suspended. Contact support for assistance.")
            if not user.password:
                raise Exception("This account uses Google sign-in. Please log in with Google.")

            # ΓöÇΓöÇ Account lockout enforcement (escalating) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
            MAX_FAILED = 5
            BASE_LOCKOUT_MINUTES = 15  # First lockout: 15 min
            MAX_LOCKOUT_MINUTES = 1440  # Cap at 24 hours

            # Check if account is currently locked
            if user.locked_until and user.locked_until > datetime.utcnow():
                remaining = int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1
                await _log_activity(db, str(user.id), "login_locked", info, success=False)
                raise Exception(f"Account temporarily locked. Try again in {remaining} minute{'s' if remaining != 1 else ''}.")

            if not verify_password(password, user.password):
                # Increment failed attempts
                user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
                if user.failed_login_attempts >= MAX_FAILED:
                    # Escalating lockout: 15 ΓåÆ 30 ΓåÆ 60 ΓåÆ 120 ΓåÆ ... (capped at 24h)
                    lockout_count = user.failed_login_attempts // MAX_FAILED  # How many times threshold hit
                    lockout_minutes = min(BASE_LOCKOUT_MINUTES * (2 ** (lockout_count - 1)), MAX_LOCKOUT_MINUTES)
                    user.locked_until = datetime.utcnow() + timedelta(minutes=lockout_minutes)
                    await db.commit()
                    await _log_activity(db, str(user.id), "account_locked", info, success=False)
                    raise Exception(f"Too many failed attempts. Account locked for {lockout_minutes} minutes.")
                await db.commit()
                await _log_activity(db, str(user.id), "login_failed", info, success=False)
                attempts_left = MAX_FAILED - (user.failed_login_attempts % MAX_FAILED)
                if attempts_left == MAX_FAILED:
                    attempts_left = MAX_FAILED  # Edge case: just after lockout expires
                raise Exception(f"Invalid email or password. {attempts_left} attempt{'s' if attempts_left != 1 else ''} remaining.")

            # ΓöÇΓöÇ Successful login ΓÇö full reset ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
            if user.failed_login_attempts and user.failed_login_attempts > 0:
                user.failed_login_attempts = 0
                user.locked_until = None

            access_token = create_access_token({"sub": str(user.id)})

            from app.core.auth import create_refresh_token, store_refresh_token
            raw_refresh, refresh_hash, family_id = create_refresh_token(str(user.id))
            try:
                device_info = (info.context.request.headers.get("user-agent") or "")[:255]
                ip_address = (info.context.request.client.host if info.context.request.client else None)
                await store_refresh_token(db, str(user.id), refresh_hash, family_id, device_info, ip_address)
            except Exception as e:
                # Log visibly ΓÇö refresh token won't work but login still proceeds
                logger.exception("[LOGIN] Could not store refresh token (user will need to re-login sooner)")
                _sentry_capture(e)

            is_production = os.getenv("ENV", "development") == "production"
            _same_site = "lax"  # Modern browsers reject samesite="none" without secure=True
            info.context.response.set_cookie(
                key="auth_token", value=access_token, httponly=True,
                secure=is_production, samesite=_same_site, max_age=60 * 15, path="/"
            )
            info.context.response.set_cookie(
                key="refresh_token", value=raw_refresh, httponly=True,
                secure=is_production, samesite=_same_site,
                max_age=60 * 60 * 24 * 30, path="/api/auth/refresh"
            )

            await _log_activity(db, str(user.id), "login", info, success=True)
            try:
                ua = (info.context.request.headers.get("user-agent") or "Unknown device")[:120]
                ip = info.context.request.client.host if info.context.request.client else "Unknown"
                # Determine a simple browser/device label from user-agent
                if "Mobile" in ua or "Android" in ua or "iPhone" in ua:
                    device_label = "≡ƒô▒ Mobile"
                elif "Windows" in ua:
                    device_label = "≡ƒÆ╗ Windows"
                elif "Mac" in ua:
                    device_label = "≡ƒìÄ Mac"
                elif "Linux" in ua:
                    device_label = "≡ƒÉº Linux"
                else:
                    device_label = "≡ƒîÉ Browser"
                await notification_service.create(
                    db, str(user.id), title=f"New sign-in detected ({device_label})",
                    message=f"You signed in from {device_label} (IP: {ip}). If this wasn't you, change your password immediately.",
                    notif_type="security", action_url="/profile#security"
                )
            except Exception as e:
                _sentry_capture(e)
                logger.warning(f"Login notification error: {e}")

            return AuthResponse(
                token=access_token,
                user=create_user_response(user)
            )

    @strawberry.mutation
    async def register(self, info: strawberry.Info, input: RegisterInput) -> AuthResponse:
        from app.core.database import AsyncSessionLocal
        from app.core.auth import get_password_hash, create_access_token
        import re, os

        if len(input.password) < 8:
            raise Exception("Password must be at least 8 characters long")
        if not re.search(r"[A-Za-z]", input.password):
            raise Exception("Password must contain at least one letter")
        if not re.search(r"\d", input.password):
            raise Exception("Password must contain at least one number")

        async with AsyncSessionLocal() as db:
            existing_user = (await db.execute(select(DbUser).where(DbUser.email == input.email))).scalars().first()
            if existing_user:
                if not existing_user.password:
                    existing_user.password = get_password_hash(input.password)
                    await db.commit()
                    await db.refresh(existing_user)
                    token = create_access_token({"sub": str(existing_user.id)})
                    is_production = os.getenv("ENV", "development") == "production"
                    _same_site = "lax"
                    info.context.response.set_cookie(
                        key="auth_token", value=token, httponly=True,
                        secure=is_production, samesite=_same_site, max_age=60 * 15, path="/"
                    )
                    return AuthResponse(token="", user=create_user_response(existing_user))
                raise Exception("An account with this email already exists")

            new_user = DbUser(
                email=input.email, password=get_password_hash(input.password),
                name=input.name, role="user", preferences={}, email_verified=False
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)

            try:
                from app.core.email_service import send_verification_email
                send_verification_email(str(new_user.id), new_user.email, new_user.name or "")
            except Exception as e:
                _sentry_capture(e)
                logger.warning(f"Verification email error: {e}")

            try:
                if input.referralCode:
                    from sqlalchemy import func, cast, String
                    code = input.referralCode.upper().strip()[:8]
                    referrer = (await db.execute(
                        select(DbUser).where(
                            func.upper(func.substr(func.replace(cast(DbUser.id, String), "-", ""), 1, 8)) == code
                        )
                    )).scalars().first()
                    if referrer:
                        referrer.referral_count = (referrer.referral_count or 0) + 1
                        # Subscription auto-upgrade disabled ΓÇö referral rewards are now badges/flair only
                        # if referrer.referral_count >= 5 and referrer.subscription_tier == "free":
                        #     referrer.subscription_tier = "standard"
                        #     referrer.subscription_expires_at = datetime.utcnow() + timedelta(days=90)
                        await db.commit()
            except Exception as e:
                _sentry_capture(e)
                logger.warning(f"Referral tracking error: {e}")

            token = create_access_token({"sub": str(new_user.id)})
            is_production = os.getenv("ENV", "development") == "production"
            _same_site = "lax"
            info.context.response.set_cookie(
                key="auth_token", value=token, httponly=True,
                secure=is_production, samesite=_same_site, max_age=60 * 15, path="/"
            )
            return AuthResponse(token="", user=create_user_response(new_user))

    @strawberry.mutation
    async def googleAuth(self, info: strawberry.Info, idToken: str) -> GoogleAuthResponse:
        try:
            import requests, certifi
            from requests.adapters import HTTPAdapter
            from urllib3.util.retry import Retry
            session = requests.Session()
            session.verify = certifi.where()
            session.trust_env = False
            retries = Retry(total=5, backoff_factor=1, status_forcelist=[500, 502, 503, 504], allowed_methods=["GET", "POST"])
            session.mount('https://', HTTPAdapter(max_retries=retries))

            client_id = os.getenv("NEXT_PUBLIC_GOOGLE_CLIENT_ID")
            if not client_id:
                raise Exception("Google Client ID not configured.")

            idinfo = id_token.verify_oauth2_token(
                idToken, google_requests.Request(session=session), client_id,
                clock_skew_in_seconds=300  # Tolerate up to 5 min clock drift
            )
            email, name, avatar = idinfo['email'], idinfo.get('name'), idinfo.get('picture')

            db = await info.context.get_db()
            user = (await db.execute(select(DbUser).where(DbUser.email == email))).scalars().first()
            is_new_user = False
            if not user:
                user = DbUser(email=email, name=name, avatar=avatar, role="user", preferences={})
                db.add(user)
                await db.commit()
                await db.refresh(user)
                is_new_user = True

            token = create_access_token({"sub": str(user.id)})
            is_production = os.getenv("ENV", "development") == "production"
            _same_site = "lax"
            info.context.response.set_cookie(
                key="auth_token", value=token, httponly=True,
                secure=is_production, samesite=_same_site, max_age=60 * 15, path="/"
            )
            try:
                if is_new_user:
                    await notification_service.notify_welcome(db, str(user.id), name=name)
                else:
                    await notification_service.create(
                        db, str(user.id), title="Welcome back! ≡ƒæï",
                        message="You just signed in to clipX. Enjoy your session!",
                        notif_type="system", action_url="/dashboard"
                    )
            except Exception as e:
                _sentry_capture(e)
                logger.warning(f"Login notification error: {e}")

            return GoogleAuthResponse(token="", user=create_user_response(user), isNewUser=is_new_user)
        except Exception as e:
            logger.exception("Google auth error")
            _sentry_capture(e)
            raise Exception(f"Google authentication failed: {str(e)}")

    @strawberry.mutation
    async def logout(self, info: strawberry.Info) -> SuccessResponse:
        info.context.response.delete_cookie(key="auth_token", path="/")
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def refreshToken(self, info: strawberry.Info) -> AuthResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        import uuid as uuid_mod
        token = create_access_token(data={
            "sub": str(user.id),
            "jti": str(uuid_mod.uuid4()),
            "rotated": True,
        }, expires_delta=timedelta(days=7))
        try:
            db = await info.context.get_db()
            user.last_active = datetime.utcnow()
            await db.commit()
        except Exception as e:
            logger.debug(f"[refreshToken] last_active update skipped: {e}")
        return AuthResponse(token=token, user=create_user_response(user))

    @strawberry.mutation
    async def forgotPassword(self, info: strawberry.Info, email: str) -> SuccessResponse:
        # ΓöÇΓöÇ Rate limit: 3 attempts per hour per IP ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
        try:
            import redis.asyncio as aioredis
            client_ip = info.context.request.client.host if info.context.request.client else "unknown"
            rate_key = f"rate:forgot_password:{client_ip}"
            r = aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)
            attempts = await r.get(rate_key)
            if attempts and int(attempts) >= 3:
                return SuccessResponse(success=True, message="If an account exists, a reset link was sent")
            pipe = r.pipeline()
            pipe.incr(rate_key)
            pipe.expire(rate_key, 3600)  # 1 hour window
            await pipe.execute()
            await r.aclose()
        except Exception as e:
            _sentry_capture(e)
            logger.warning(f"[forgotPassword] Rate limit check skipped: {e}")

        db = await info.context.get_db()
        user = (await db.execute(select(DbUser).where(DbUser.email == email))).scalars().first()
        if user and user.password:
            try:
                from app.core.email_service import send_password_reset_email
                # Invalidate any existing tokens for this user
                from sqlalchemy import update
                await db.execute(
                    update(DbPasswordResetToken)
                    .where(DbPasswordResetToken.user_id == user.id, DbPasswordResetToken.is_used == False)
                    .values(is_used=True)
                )
                # Create a new DB-tracked token
                reset_token_str = secrets.token_urlsafe(64)
                db.add(DbPasswordResetToken(
                    user_id=user.id,
                    token=reset_token_str,
                    expires_at=datetime.utcnow() + timedelta(hours=1),
                ))
                await db.commit()
                # Also create a JWT for the email link (carries user_id)
                send_password_reset_email(str(user.id), user.email, user.name or "User")
            except Exception as e:
                _sentry_capture(e)
                logger.exception("Failed to send reset email")
        # Always return success to prevent email enumeration
        return SuccessResponse(success=True, message="If an account exists, a reset link was sent")

    @strawberry.mutation
    async def resetPassword(self, info: strawberry.Info, token: str, newPassword: str) -> SuccessResponse:
        import re
        from app.core.auth import decode_access_token, get_password_hash, revoke_all_user_tokens
        # Validate password strength
        if len(newPassword) < 8:
            raise Exception("Password must be at least 8 characters long")
        if not re.search(r"[A-Za-z]", newPassword):
            raise Exception("Password must contain at least one letter")
        if not re.search(r"\d", newPassword):
            raise Exception("Password must contain at least one number")

        payload = decode_access_token(token)
        if not payload or payload.get("type") != "reset":
            raise Exception("Invalid or expired reset token")
        user_id = payload.get("sub")
        db = await info.context.get_db()
        user = (await db.execute(select(DbUser).where(DbUser.id == user_id))).scalars().first()
        if not user:
            raise Exception("User not found")
        user.password = get_password_hash(newPassword)
        # Reset account lockout if any
        user.failed_login_attempts = 0
        user.locked_until = None
        await db.commit()
        # Revoke all existing sessions (force re-login everywhere)
        try:
            await revoke_all_user_tokens(db, str(user.id))
        except Exception as e:
            _sentry_capture(e)
            logger.exception("[resetPassword] Failed to revoke tokens")
        # Notify user
        try:
            await notification_service.create(
                db, str(user.id), title="Password Updated ≡ƒöÆ",
                message="Your password was successfully changed. All sessions have been logged out.",
                notif_type="system"
            )
        except Exception as e:
            logger.debug(f"[resetPassword] notification skipped: {e}")
        await _log_activity(db, str(user.id), "password_reset", info, success=True)
        return SuccessResponse(success=True, message="Password reset successfully")

    @strawberry.mutation
    async def changePassword(self, info: strawberry.Info, currentPassword: str, newPassword: str) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if not user.password:
            raise Exception("This account uses Google sign-in. Password change is not available.")
        if not verify_password(currentPassword, user.password):
            raise Exception("Current password is incorrect")
        if len(newPassword) < 6:
            raise Exception("New password must be at least 6 characters")
        db = await info.context.get_db()
        user.password = get_password_hash(newPassword)
        await db.commit()
        return SuccessResponse(success=True, message="Password changed successfully")

    @strawberry.mutation
    async def verifyEmail(self, info: strawberry.Info, token: str) -> SuccessResponse:
        from app.core.auth import decode_access_token
        payload = decode_access_token(token)
        if not payload or payload.get("type") != "email_verify":
            raise Exception("Invalid or expired verification token")
        user_id = payload.get("sub")
        if not user_id:
            raise Exception("Invalid token")
        db = await info.context.get_db()
        import uuid
        try:
            result = await db.execute(select(DbUser).where(DbUser.id == uuid.UUID(user_id)))
        except ValueError:
            result = await db.execute(select(DbUser).where(DbUser.email == user_id))
        user = result.scalars().first()
        if not user:
            raise Exception("User not found")
        user.email_verified = True
        await db.commit()
        return SuccessResponse(success=True, message="Email verified successfully!")

    @strawberry.mutation
    async def resendVerification(self, info: strawberry.Info) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if getattr(user, 'email_verified', False):
            return SuccessResponse(success=True, message="Email already verified")

        # Rate limit: max 3 resends per hour per user (prevents inbox flooding)
        try:
            from app.core.cache import cache
            redis_ok = await cache._ensure_connected()
            if redis_ok and cache._redis:
                rk = f"resend_verify:{user.id}"
                cur = await cache._redis.get(rk)
                if cur and int(cur) >= 3:
                    # Return success to prevent enumeration ΓÇö don't reveal rate limit
                    return SuccessResponse(success=True, message="Verification email sent!")
                pipe = cache._redis.pipeline()
                pipe.incr(rk)
                if not cur:
                    pipe.expire(rk, 3600)  # 1 hour window
                await pipe.execute()
        except Exception as e:
            logger.warning(f"Redis error in resend rate limit: {e}")

        try:
            from app.core.email_service import send_verification_email
            send_verification_email(str(user.id), user.email, user.name or "")
            return SuccessResponse(success=True, message="Verification email sent!")
        except Exception as e:
            raise Exception(f"Failed to send email: {e}")

