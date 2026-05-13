# pyright: reportCallIssue=false, reportArgumentType=false, reportGeneralTypeIssues=false, reportReturnType=false
"""User mutations: profile, watchlist, history, preferences, sessions, downloads, etc."""

import strawberry
from typing import List, Optional
from datetime import datetime, timedelta

from sqlalchemy.future import select

from app.services.movie_service import movie_service
from app.services.notification_service import notification_service
from app.core.auth import verify_password, get_password_hash
from app.models.database import (
    User as DbUser, Watchlist as DbWatchlist, History as DbHistory,
    Notification as DbNotification, RecentlyViewed as DbRecentlyViewed,
    UserLayoutPreference as DbUserLayoutPreference, PushSubscription as DbPushSubscription,
)
from app.api.graphql.types import (
    User, SuccessResponse, UpdateProfileInput, ToggleWatchlistResponse,
    NotificationPreferencesType, NotificationPreferencesInput,
    OfflineDownloadToken, InteractionInput,
)
from app.api.graphql.helpers import _sentry_capture, create_user_response, logger


@strawberry.type
class UserMutations:

    @strawberry.mutation
    async def updateProfile(self, info: strawberry.Info, input: UpdateProfileInput) -> User:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()

        # ΓöÇΓöÇ Security: prevent role injection via profile update ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
        # UpdateProfileInput intentionally excludes 'role'. This guard
        # ensures no crafted GraphQL variable can escalate privileges.
        if hasattr(input, 'role'):
            raise Exception("Role changes are not permitted through profile updates")

        if input.name:
            user.name = input.name
        if input.avatar:
            user.avatar = input.avatar
        if input.bio:
            user.bio = input.bio
        current_prefs = dict(user.preferences) if user.preferences else {}
        if input.favoriteGenres is not None:
            current_prefs["favoriteGenres"] = input.favoriteGenres
        if input.preferences:
            if input.preferences.theme is not None:
                current_prefs["theme"] = input.preferences.theme
            if input.preferences.email_notifications is not None:
                current_prefs["emailNotifications"] = input.preferences.email_notifications
            if input.preferences.auto_play_trailers is not None:
                current_prefs["autoPlayTrailers"] = input.preferences.auto_play_trailers

        # Explicitly ensure role is NEVER mutated from this path
        user.role = user.role  # no-op ΓÇö defensive reassignment

        user.preferences = current_prefs
        await db.commit()
        await db.refresh(user)
        return create_user_response(user)

    @strawberry.mutation
    async def deleteAccount(self, info: strawberry.Info, password: Optional[str] = None) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if user.password and password:
            if not verify_password(password, user.password):
                raise Exception("Incorrect password")
        elif user.password and not password:
            raise Exception("Password required to delete account")

        db = await info.context.get_db()
        user_id = str(user.id)

        # ΓöÇΓöÇ Explicit cascade cleanup ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
        # Database FK ON DELETE CASCADE should handle this, but we
        # explicitly scrub sensitive tables to guarantee no orphans.
        from sqlalchemy import text
        try:
            await db.execute(text("DELETE FROM refresh_tokens WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM push_subscriptions WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM login_activity WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM offline_downloads WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM password_reset_tokens WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM notification_preferences WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM yearly_stats WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM user_layout_preferences WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM chat_messages WHERE user_id = :uid"), {"uid": user_id})
        except Exception as e:
            # Non-fatal: tables may not exist yet in dev; CASCADE will handle it
            try:
                import sentry_sdk
                sentry_sdk.capture_exception(e)
            except Exception:
                pass
            logger.exception("[deleteAccount] Cascade cleanup partial")

        # Clear auth cookies
        info.context.response.delete_cookie(key="auth_token", path="/")
        info.context.response.delete_cookie(key="refresh_token", path="/api/auth/refresh")

        await db.delete(user)
        await db.commit()
        return SuccessResponse(success=True, message="Account deleted successfully")

    @strawberry.mutation
    async def toggleWatchlist(self, info: strawberry.Info, movieId: strawberry.ID) -> ToggleWatchlistResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        result = await db.execute(select(DbWatchlist).where(
            DbWatchlist.user_id == user.id, DbWatchlist.moviebox_id == str(movieId)
        ))
        existing = result.scalars().first()
        if existing:
            await db.delete(existing)
            await db.commit()
            return ToggleWatchlistResponse(added=False, message="Removed from watchlist")
        else:
            db.add(DbWatchlist(user_id=user.id, moviebox_id=str(movieId)))
            await db.commit()
            try:
                details = await movie_service.get_details(str(movieId), db=db)
                title = details.title if details else "Content"
                await notification_service.notify_watchlist_add(db, str(user.id), title, str(movieId))
            except Exception as e:
                _sentry_capture(e)
                logger.warning(f"Notification error (watchlist): {e}")
            return ToggleWatchlistResponse(added=True, message="Added to watchlist")

    @strawberry.mutation
    async def addToWatchlist(self, info: strawberry.Info, movieId: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        db.add(DbWatchlist(user_id=user.id, moviebox_id=str(movieId)))
        await db.commit()
        try:
            details = await movie_service.get_details(str(movieId), db=db)
            title = details.title if details else "Content"
            await notification_service.notify_watchlist_add(db, str(user.id), title, str(movieId))
        except Exception as e:
            _sentry_capture(e)
            logger.warning(f"Notification error (watchlist): {e}")
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def removeFromWatchlist(self, info: strawberry.Info, movieId: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        result = await db.execute(select(DbWatchlist).where(
            DbWatchlist.user_id == user.id, DbWatchlist.moviebox_id == str(movieId)
        ))
        item = result.scalars().first()
        if item:
            await db.delete(item)
            await db.commit()
        return SuccessResponse(success=True, message="Removed from watchlist")

    @strawberry.mutation
    async def updateWatchProgress(self, info: strawberry.Info, movieId: str, currentTime: int, duration: int, contentType: str = "movie") -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        history_item = (await db.execute(
            select(DbHistory).where(DbHistory.user_id == user.id, DbHistory.moviebox_id == movieId)
        )).scalars().first()
        if history_item:
            history_item.current_time = currentTime
            if duration > 0:
                history_item.duration = max(history_item.duration or 0, duration)
            history_item.updated_at = datetime.utcnow()
        else:
            db.add(DbHistory(user_id=user.id, moviebox_id=movieId, content_type=contentType, current_time=currentTime, duration=duration))
        recent_item = (await db.execute(
            select(DbRecentlyViewed).where(DbRecentlyViewed.user_id == user.id, DbRecentlyViewed.moviebox_id == movieId)
        )).scalars().first()
        if recent_item:
            recent_item.viewed_at = datetime.utcnow()
        else:
            db.add(DbRecentlyViewed(user_id=user.id, moviebox_id=movieId, content_type=contentType))
        await db.commit()
        return SuccessResponse(success=True, message="Progress saved")

    @strawberry.mutation
    async def recordWatchProgress(self, info: strawberry.Info, movieId: strawberry.ID, currentTime: int, duration: int) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        history_item = (await db.execute(
            select(DbHistory).where(DbHistory.user_id == user.id, DbHistory.moviebox_id == str(movieId))
        )).scalars().first()
        is_new_watch = history_item is None
        if history_item:
            history_item.current_time = currentTime
            history_item.duration = duration
            history_item.updated_at = datetime.utcnow()
        else:
            history_item = DbHistory(user_id=user.id, moviebox_id=str(movieId), current_time=currentTime, duration=duration, content_type="movie")
            db.add(history_item)
        await db.commit()
        if is_new_watch:
            try:
                from sqlalchemy import func
                total_watched = (await db.execute(select(func.count(DbHistory.id)).where(DbHistory.user_id == user.id))).scalar() or 0
                if total_watched in [5, 10, 25, 50, 100]:
                    await notification_service.notify_watch_milestone(db, str(user.id), total_watched)
            except Exception as e:
                _sentry_capture(e)
                logger.warning(f"Milestone check error: {e}")
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def clearWatchHistory(self, info: strawberry.Info) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        from sqlalchemy import delete
        await db.execute(delete(DbHistory).where(DbHistory.user_id == user.id))
        await db.execute(delete(DbRecentlyViewed).where(DbRecentlyViewed.user_id == user.id))
        await db.commit()
        return SuccessResponse(success=True, message="Watch history cleared")

    @strawberry.mutation
    async def saveLayoutPreference(self, info: strawberry.Info, layoutOrder: List[str]) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        existing = (await db.execute(
            select(DbUserLayoutPreference).where(DbUserLayoutPreference.user_id == user.id)
        )).scalars().first()
        if existing:
            existing.layout_order = layoutOrder
            existing.updated_at = datetime.utcnow()
        else:
            db.add(DbUserLayoutPreference(user_id=user.id, layout_order=layoutOrder))
        await db.commit()
        return SuccessResponse(success=True, message="Layout saved")

    @strawberry.mutation
    async def registerPushToken(self, info: strawberry.Info, fcmToken: str, deviceType: str = "web") -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        existing = (await db.execute(
            select(DbPushSubscription).where(DbPushSubscription.user_id == user.id, DbPushSubscription.fcm_token == fcmToken)
        )).scalars().first()
        if existing:
            existing.is_active = True
        else:
            db.add(DbPushSubscription(user_id=user.id, fcm_token=fcmToken, device_type=deviceType))
        await db.commit()
        return SuccessResponse(success=True, message="Push token registered")

    @strawberry.mutation
    async def unregisterPushToken(self, info: strawberry.Info, fcmToken: str) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        existing = (await db.execute(
            select(DbPushSubscription).where(DbPushSubscription.user_id == user.id, DbPushSubscription.fcm_token == fcmToken)
        )).scalars().first()
        if existing:
            existing.is_active = False
            await db.commit()
        return SuccessResponse(success=True, message="Push token removed")

    @strawberry.mutation
    async def updateNotificationPreferences(
        self, info: strawberry.Info, input: NotificationPreferencesInput
    ) -> NotificationPreferencesType:
        """Update granular push notification preferences."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        current_prefs = dict(user.preferences) if user.preferences else {}
        np = current_prefs.get("notification_preferences", {})

        if input.newRelease is not None:
            np["newRelease"] = input.newRelease
        if input.watchlist is not None:
            np["watchlist"] = input.watchlist
        if input.recommendations is not None:
            np["recommendations"] = input.recommendations
        if input.accountActivity is not None:
            np["accountActivity"] = input.accountActivity
        if input.promotions is not None:
            np["promotions"] = input.promotions
        if input.socialUpdates is not None:
            np["socialUpdates"] = input.socialUpdates
        if input.downloadComplete is not None:
            np["downloadComplete"] = input.downloadComplete

        current_prefs["notification_preferences"] = np
        user.preferences = current_prefs
        await db.commit()

        return NotificationPreferencesType(
            newRelease=np.get("newRelease", True),
            watchlist=np.get("watchlist", True),
            recommendations=np.get("recommendations", True),
            accountActivity=np.get("accountActivity", True),
            promotions=np.get("promotions", False),
            socialUpdates=np.get("socialUpdates", True),
            downloadComplete=np.get("downloadComplete", True),
        )

    @strawberry.mutation
    async def revokeSession(self, info: strawberry.Info, sessionId: str) -> SuccessResponse:
        """Let a user revoke one of their own active sessions."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                # Verify the session belongs to this user
                result = await db.execute(text("""
                    UPDATE refresh_tokens
                    SET is_revoked = TRUE
                    WHERE id = :sid AND user_id = :uid AND is_revoked = FALSE
                    RETURNING id
                """), {"sid": sessionId, "uid": str(user.id)})
                row = result.fetchone()
                await db.commit()
                if row:
                    return SuccessResponse(success=True, message="Session revoked")
                return SuccessResponse(success=False, message="Session not found or already revoked")
        except Exception as e:
            _sentry_capture(e)
            logger.exception("[revokeSession] Error")
            return SuccessResponse(success=False, message="Failed to revoke session")

    @strawberry.mutation
    async def revokeMySession(self, info: strawberry.Info, sessionId: strawberry.ID) -> SuccessResponse:
        """Revoke a specific session (refresh token) for the current user."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            result = await db.execute(text("""
                UPDATE refresh_tokens SET is_revoked = TRUE
                WHERE id = :sid AND user_id = :uid AND is_revoked = FALSE
            """), {"sid": str(sessionId), "uid": str(user.id)})
            await db.commit()
            if result.rowcount > 0:
                return SuccessResponse(success=True, message="Session revoked")
        return SuccessResponse(success=False, message="Session not found")

    @strawberry.mutation
    async def revokeAllMySessions(self, info: strawberry.Info) -> SuccessResponse:
        """Revoke all sessions except the current one (force logout everywhere else)."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        # Identify current session by its token hash
        current_hash = None
        try:
            request = info.context.request
            raw = request.cookies.get("refresh_token")
            if raw:
                import hashlib
                current_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        except Exception:
            pass  # Non-critical: session matching is best-effort

        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            if current_hash:
                await db.execute(text("""
                    UPDATE refresh_tokens SET is_revoked = TRUE
                    WHERE user_id = :uid AND is_revoked = FALSE AND token_hash != :current
                """), {"uid": str(user.id), "current": current_hash})
            else:
                await db.execute(text("""
                    UPDATE refresh_tokens SET is_revoked = TRUE
                    WHERE user_id = :uid AND is_revoked = FALSE
                """), {"uid": str(user.id)})
            await db.commit()
        return SuccessResponse(success=True, message="All other sessions revoked")

    @strawberry.mutation
    async def requestOfflineDownload(
        self, info: strawberry.Info, movieboxId: str,
        contentType: str = "movie", quality: str = "720p",
    ) -> OfflineDownloadToken:
        """Generate an encrypted download token for offline viewing."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        tier = getattr(user, "subscription_tier", "free") or "free"
        from app.core.drm import TIER_QUALITY_MAP
        tier_config = TIER_QUALITY_MAP.get(tier, TIER_QUALITY_MAP["free"])
        if not tier_config.get("allow_download", False):
            raise Exception("Offline downloads require a Standard or Pro subscription.")

        import os, hashlib
        encryption_key = os.urandom(32).hex()  # AES-256 key
        iv = os.urandom(16).hex()              # AES IV

        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        expires_at = datetime.utcnow() + timedelta(days=30)

        async with AsyncSessionLocal() as db:
            # Upsert: if already downloaded, refresh the key
            await db.execute(text("""
                INSERT INTO offline_downloads (user_id, moviebox_id, content_type, encryption_key, iv, quality, expires_at)
                VALUES (:uid, :mid, :ct, :key, :iv, :q, :exp)
                ON CONFLICT (user_id, moviebox_id) DO UPDATE SET
                    encryption_key = EXCLUDED.encryption_key,
                    iv = EXCLUDED.iv,
                    quality = EXCLUDED.quality,
                    expires_at = EXCLUDED.expires_at
            """), {
                "uid": str(user.id), "mid": movieboxId, "ct": contentType,
                "key": encryption_key, "iv": iv, "q": quality, "exp": expires_at,
            })
            await db.commit()

        return OfflineDownloadToken(
            movieboxId=movieboxId,
            encryptionKey=encryption_key,
            iv=iv,
            quality=quality,
            expiresAt=str(expires_at),
        )

    @strawberry.mutation
    async def trackInteraction(
        self, info: strawberry.Info, input: InteractionInput
    ) -> SuccessResponse:
        """Track a user interaction (view, click, etc.) for analytics."""
        user = await info.context.user
        user_id = str(user.id) if user else None
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                await db.execute(text("""
                    INSERT INTO movie_views (user_id, moviebox_id, title, genre)
                    VALUES (:uid, :mid, :title, :genre)
                """), {
                    "uid": user_id,
                    "mid": input.movieboxId or "",
                    "title": input.title or "",
                    "genre": input.genre or "",
                })
                await db.commit()
        except Exception as e:
            _sentry_capture(e)
            logger.warning(f"[trackInteraction] Error: {e}")
        return SuccessResponse(success=True, message="Interaction tracked")

    @strawberry.mutation
    async def updateEmailPreferences(
        self, info: strawberry.Info,
        marketing: Optional[bool] = None, security: Optional[bool] = None,
        newReleases: Optional[bool] = None, watchlistUpdates: Optional[bool] = None,
        weeklyDigest: Optional[bool] = None, socialActivity: Optional[bool] = None,
        accountAlerts: Optional[bool] = None,
    ) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        import json
        try:
            async with AsyncSessionLocal() as db:
                row = (await db.execute(text("SELECT preferences FROM users WHERE id = :uid"), {"uid": str(user.id)})).fetchone()
                prefs = row.preferences if row and row.preferences else {}
                ep = prefs.get("emailPreferences", {})
                # Merge updates
                if marketing is not None: ep["marketing"] = marketing
                if security is not None: ep["security"] = security
                if newReleases is not None: ep["newReleases"] = newReleases
                if watchlistUpdates is not None: ep["watchlistUpdates"] = watchlistUpdates
                if weeklyDigest is not None: ep["weeklyDigest"] = weeklyDigest
                if socialActivity is not None: ep["socialActivity"] = socialActivity
                if accountAlerts is not None: ep["accountAlerts"] = accountAlerts
                prefs["emailPreferences"] = ep
                await db.execute(text("UPDATE users SET preferences = :p WHERE id = :uid"),
                    {"p": json.dumps(prefs), "uid": str(user.id)})
                await db.commit()
                return SuccessResponse(success=True, message="Email preferences updated")
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=str(e))

    @strawberry.mutation
    async def exportMyData(self, info: strawberry.Info) -> SuccessResponse:
        """GDPR Article 20 ΓÇö Data Portability. Returns a JSON string of all user data."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        import json
        try:
            async with AsyncSessionLocal() as db:
                export = {"exportedAt": datetime.utcnow().isoformat(), "userId": str(user.id)}

                # Profile
                profile = (await db.execute(text("""
                    SELECT email, name, avatar, bio, role, subscription_tier,
                           created_at, last_active, email_verified, referral_count
                    FROM users WHERE id = :uid
                """), {"uid": str(user.id)})).fetchone()
                if profile:
                    export["profile"] = {
                        "email": profile.email, "name": profile.name, "avatar": profile.avatar,
                        "bio": profile.bio, "role": profile.role, "tier": profile.subscription_tier,
                        "createdAt": str(profile.created_at), "lastActive": str(profile.last_active),
                        "emailVerified": profile.email_verified, "referralCount": profile.referral_count,
                    }

                # Watch History
                history = (await db.execute(text("""
                    SELECT moviebox_id, content_type, current_time, duration, updated_at
                    FROM history WHERE user_id = :uid ORDER BY updated_at DESC
                """), {"uid": str(user.id)})).fetchall()
                export["watchHistory"] = [
                    {"movieboxId": h.moviebox_id, "contentType": h.content_type,
                     "currentTime": h.current_time, "duration": h.duration,
                     "watchedAt": str(h.updated_at)} for h in history
                ]

                # Watchlist
                watchlist = (await db.execute(text("""
                    SELECT moviebox_id, content_type, added_at
                    FROM watchlist WHERE user_id = :uid ORDER BY added_at DESC
                """), {"uid": str(user.id)})).fetchall()
                export["watchlist"] = [
                    {"movieboxId": w.moviebox_id, "contentType": w.content_type,
                     "addedAt": str(w.added_at)} for w in watchlist
                ]

                # Reviews
                reviews = (await db.execute(text("""
                    SELECT moviebox_id, content, rating, created_at
                    FROM reviews WHERE user_id = :uid ORDER BY created_at DESC
                """), {"uid": str(user.id)})).fetchall()
                export["reviews"] = [
                    {"movieboxId": r.moviebox_id, "content": r.content,
                     "rating": r.rating, "createdAt": str(r.created_at)} for r in reviews
                ]

                # Notifications
                notifs = (await db.execute(text("""
                    SELECT title, message, type, is_read, created_at
                    FROM notifications WHERE user_id = :uid ORDER BY created_at DESC LIMIT 500
                """), {"uid": str(user.id)})).fetchall()
                export["notifications"] = [
                    {"title": n.title, "message": n.message, "type": n.type,
                     "isRead": n.is_read, "createdAt": str(n.created_at)} for n in notifs
                ]

                # Reports submitted
                reports = (await db.execute(text("""
                    SELECT moviebox_id, reason, description, status, created_at
                    FROM reports WHERE user_id = :uid
                """), {"uid": str(user.id)})).fetchall()
                export["reports"] = [
                    {"movieboxId": r.moviebox_id, "reason": r.reason,
                     "description": r.description, "status": r.status,
                     "createdAt": str(r.created_at)} for r in reports
                ]

                data_json = json.dumps(export, indent=2, default=str)
                return SuccessResponse(success=True, message=data_json)
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=f"Export failed: {str(e)}")

