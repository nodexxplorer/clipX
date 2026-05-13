# pyright: reportCallIssue=false, reportArgumentType=false, reportGeneralTypeIssues=false, reportReturnType=false
"""Admin mutations: adminCreateMovie, adminBan, flags, impersonate, etc."""

import strawberry
from typing import List, Optional
from datetime import datetime, timedelta

from sqlalchemy.future import select

from app.services.notification_service import notification_service
from app.models.database import (
    User as DbUser, Notification as DbNotification,
)
from app.api.graphql.types import (
    SuccessResponse, Movie, Genre, MovieInput, FeatureFlag, FeatureFlagInput,
    ImpersonationResponse,
)
from app.api.graphql.helpers import _sentry_capture, logger


@strawberry.type
class AdminMutations:

    @strawberry.mutation
    async def adminFeatureReview(self, info: strawberry.Info, id: strawberry.ID, featured: bool) -> SuccessResponse:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            await db.execute(text("UPDATE reviews SET is_featured = :f WHERE id = :id"), {"f": featured, "id": str(id)})
            await db.commit()
        return SuccessResponse(success=True, message="Review updated")

    @strawberry.mutation
    async def adminDeleteReview(self, info: strawberry.Info, id: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            await db.execute(text("DELETE FROM reviews WHERE id = :id"), {"id": str(id)})
            await db.commit()
        return SuccessResponse(success=True, message="Review deleted")

    @strawberry.mutation
    async def adminBulkBanUsers(self, info: strawberry.Info, userIds: List[strawberry.ID], reason: Optional[str] = "Banned by admin") -> SuccessResponse:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            for uid in userIds:
                await db.execute(text("UPDATE users SET is_banned = TRUE WHERE id = :id"), {"id": str(uid)})
            await db.commit()
        return SuccessResponse(success=True, message=f"{len(userIds)} user(s) banned")

    @strawberry.mutation
    async def adminBulkDeleteReviews(self, info: strawberry.Info, reviewIds: List[strawberry.ID]) -> SuccessResponse:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            for rid in reviewIds:
                await db.execute(text("DELETE FROM reviews WHERE id = :id"), {"id": str(rid)})
            await db.commit()
        return SuccessResponse(success=True, message=f"{len(reviewIds)} review(s) deleted")

    @strawberry.mutation
    async def adminRevokeSession(self, info: strawberry.Info, sessionId: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            await db.execute(text("UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = :id"), {"id": str(sessionId)})
            await db.commit()
        return SuccessResponse(success=True, message="Session revoked")

    @strawberry.mutation
    async def adminSendNotification(self, info: strawberry.Info, title: str, message: str, userId: Optional[strawberry.ID] = None, notifType: Optional[str] = "system") -> SuccessResponse:
        user = await info.context.user
        if not user or user.role != "admin":
            raise ValueError("Admin access required")
        db = await info.context.get_db()
        if userId:
            db.add(DbNotification(user_id=userId, title=title, message=message, type=notifType or "system"))
            await db.commit()
            return SuccessResponse(success=True, message="Notification sent")
        user_ids = [str(row[0]) for row in (await db.execute(select(DbUser.id))).all()]
        for uid in user_ids:
            db.add(DbNotification(user_id=uid, title=title, message=message, type=notifType or "system"))
        await db.commit()
        return SuccessResponse(success=True, message=f"Notification sent to {len(user_ids)} users")

    @strawberry.mutation
    async def adminCreateMovie(self, info: strawberry.Info, input: MovieInput) -> Movie:
        """Admin: create a new movie entry in the local database."""
        user = await info.context.user
        if not user or getattr(user, 'role', 'user') != 'admin':
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        import uuid
        try:
            movie_id = str(uuid.uuid4())
            async with AsyncSessionLocal() as db:
                await db.execute(text("""
                    INSERT INTO movies (id, title, overview, poster_url, backdrop_url, trailer_url,
                                       release_date, runtime, rating, tagline, content_type, created_at)
                    VALUES (:id, :title, :overview, :poster, :backdrop, :trailer,
                            :release_date, :runtime, :rating, :tagline, :ctype, NOW())
                """), {
                    "id": movie_id, "title": input.title, "overview": input.overview,
                    "poster": input.posterUrl, "backdrop": input.backdropUrl,
                    "trailer": input.trailerUrl, "release_date": input.releaseDate,
                    "runtime": input.runtime or 0, "rating": input.rating or 0.0,
                    "tagline": input.tagline, "ctype": input.contentType or "movie",
                })
                # Insert genres if provided
                if input.genres:
                    for genre_name in input.genres:
                        await db.execute(text("""
                            INSERT INTO movie_genres (movie_id, genre_name)
                            VALUES (:mid, :gn) ON CONFLICT DO NOTHING
                        """), {"mid": movie_id, "gn": genre_name})
                await db.commit()

            year_str = input.releaseDate[:4] if input.releaseDate and len(input.releaseDate) >= 4 else ""
            return Movie(
                id=strawberry.ID(movie_id), title=input.title,
                overview=input.overview or "", tagline=input.tagline or "",
                posterUrl=input.posterUrl, backdropUrl=input.backdropUrl,
                trailerUrl=input.trailerUrl, releaseDate=input.releaseDate or "",
                year=year_str, runtime=input.runtime or 0,
                rating=input.rating or 0.0, voteCount=0, popularity=0.0,
                status="released", contentType=input.contentType or "movie",
                genres=[Genre(id=strawberry.ID(g), name=g) for g in (input.genres or [])],
            )
        except Exception as e:
            _sentry_capture(e)
            raise Exception(f"Failed to create movie: {str(e)}")

    @strawberry.mutation
    async def adminUpdateUserRole(self, info: strawberry.Info, id: strawberry.ID, role: str) -> SuccessResponse:
        user = await info.context.user
        if not user or user.role != "admin":
            raise ValueError("Admin access required")
        if role not in ("admin", "user"):
            raise ValueError("Invalid role. Must be 'admin' or 'user'")
        db = await info.context.get_db()
        target = (await db.execute(select(DbUser).where(DbUser.id == id))).scalars().first()
        if not target:
            raise ValueError("User not found")
        target.role = role
        await db.commit()
        return SuccessResponse(success=True, message=f"User role updated to {role}")

    @strawberry.mutation
    async def adminDeleteUser(self, info: strawberry.Info, id: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user or user.role != "admin":
            raise ValueError("Admin access required")
        if str(user.id) == str(id):
            raise ValueError("Cannot delete yourself")
        db = await info.context.get_db()
        target = (await db.execute(select(DbUser).where(DbUser.id == id))).scalars().first()
        if not target:
            raise ValueError("User not found")
        await db.delete(target)
        await db.commit()
        return SuccessResponse(success=True, message="User deleted")

    @strawberry.mutation
    async def updateFeatureFlag(self, info: strawberry.Info, input: FeatureFlagInput) -> FeatureFlag:
        """Toggle a feature flag on/off. Admin only."""
        user = await info.context.user
        if not user or user.role != "admin":
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            # Upsert the flag
            row = (await db.execute(text("""
                INSERT INTO feature_flags (key, label, enabled, description, updated_by)
                VALUES (:key, :label, :enabled, :desc, :uid)
                ON CONFLICT (key) DO UPDATE SET
                    enabled = EXCLUDED.enabled,
                    label = COALESCE(EXCLUDED.label, feature_flags.label),
                    description = COALESCE(EXCLUDED.description, feature_flags.description),
                    updated_by = EXCLUDED.updated_by,
                    updated_at = NOW()
                RETURNING id, key, label, enabled, description, updated_at, updated_by
            """), {
                "key": input.key, "label": input.label or input.key,
                "enabled": input.enabled, "desc": input.description,
                "uid": str(user.id),
            })).fetchone()
            # Log the admin action
            await db.execute(text("""
                INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details, ip_address)
                VALUES (:aid, :action, 'feature_flag', :tid, :details, :ip)
            """), {
                "aid": str(user.id), "action": "update_feature_flag",
                "tid": input.key, "details": f"Set {input.key} = {input.enabled}",
                "ip": info.context.request.client.host if info.context.request.client else "unknown",
            })
            await db.commit()
            return FeatureFlag(
                id=str(row.id), key=row.key, label=row.label or row.key,
                enabled=row.enabled, description=row.description,
                updatedAt=str(row.updated_at) if row.updated_at else "",
                updatedBy=str(row.updated_by) if row.updated_by else None,
            )

    @strawberry.mutation
    async def scheduleContent(
        self, info: strawberry.Info,
        movieboxId: str, title: str, publishAt: str,
    ) -> SuccessResponse:
        user = await info.context.user
        if not user or getattr(user, 'role', 'user') != 'admin':
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                await db.execute(text("""
                    INSERT INTO content_schedule (id, moviebox_id, title, publish_at, status, created_by, created_at)
                    VALUES (gen_random_uuid(), :mid, :title, :pat, 'scheduled', :cby, NOW())
                """), {"mid": movieboxId, "title": title, "pat": publishAt, "cby": str(user.id)})
                await db.commit()
                return SuccessResponse(success=True, message=f"Content scheduled for {publishAt}")
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=str(e))

    @strawberry.mutation
    async def updateSeoMetadata(
        self, info: strawberry.Info,
        movieboxId: str, title: Optional[str] = None,
        description: Optional[str] = None, ogImage: Optional[str] = None,
        keywords: Optional[str] = None,
    ) -> SuccessResponse:
        user = await info.context.user
        if not user or getattr(user, 'role', 'user') != 'admin':
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                await db.execute(text("""
                    INSERT INTO seo_metadata (id, moviebox_id, title, description, og_image, keywords, updated_at)
                    VALUES (gen_random_uuid(), :mid, :t, :d, :og, :kw, NOW())
                    ON CONFLICT (moviebox_id) DO UPDATE SET
                        title = COALESCE(:t, seo_metadata.title),
                        description = COALESCE(:d, seo_metadata.description),
                        og_image = COALESCE(:og, seo_metadata.og_image),
                        keywords = COALESCE(:kw, seo_metadata.keywords),
                        updated_at = NOW()
                """), {"mid": movieboxId, "t": title, "d": description, "og": ogImage, "kw": keywords})
                await db.commit()
                return SuccessResponse(success=True, message="SEO metadata updated")
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=str(e))

    @strawberry.mutation
    async def impersonateUser(
        self, info: strawberry.Info, targetUserId: str,
    ) -> ImpersonationResponse:
        """Time-limited admin impersonation (30min). Audit-logged."""
        user = await info.context.user
        if not user or getattr(user, 'role', 'user') != 'admin':
            return ImpersonationResponse(success=False, message="Admin access required")
        from app.core.database import AsyncSessionLocal
        from app.core.auth import create_access_token
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                target = (await db.execute(text("SELECT id, email FROM users WHERE id = :uid"),
                    {"uid": targetUserId})).fetchone()
                if not target:
                    return ImpersonationResponse(success=False, message="User not found")
                # Create time-limited token (30 min)
                expires = timedelta(minutes=30)
                token = create_access_token(data={"sub": str(target.id), "impersonated_by": str(user.id)}, expires_delta=expires)
                expires_at = datetime.utcnow() + expires
                # Audit log
                await db.execute(text("""
                    INSERT INTO admin_audit_log (id, admin_user_id, action, target_id, details, ip_address, created_at)
                    VALUES (gen_random_uuid(), :aid, 'impersonate_user', :tid,
                            :det, :ip, NOW())
                """), {
                    "aid": str(user.id), "tid": targetUserId,
                    "det": f"Impersonated user {target.email} for 30 minutes",
                    "ip": info.context.request.client.host if hasattr(info.context, 'request') else "unknown"
                })
                await db.commit()
                return ImpersonationResponse(
                    success=True, token=token,
                    expiresAt=expires_at.isoformat(),
                    message=f"Impersonating {target.email} for 30 minutes"
                )
        except Exception as e:
            _sentry_capture(e)
            return ImpersonationResponse(success=False, message=str(e))

    @strawberry.mutation
    async def checkNewEpisodes(self, info: strawberry.Info) -> SuccessResponse:
        """Admin trigger: scan user histories and create notifications for new episodes."""
        user = await info.context.user
        if not user or getattr(user, 'role', 'user') != 'admin':
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            notified = 0
            async with AsyncSessionLocal() as db:
                # Find series with recent history entries
                series_users = (await db.execute(text("""
                    SELECT DISTINCT h.user_id, h.moviebox_id
                    FROM history h WHERE h.content_type = 'series'
                    AND h.updated_at >= NOW() - INTERVAL '30 days'
                """))).fetchall()
                for su in series_users:
                    # Create a notification for each active series viewer
                    await db.execute(text("""
                        INSERT INTO notifications (id, user_id, title, message, type, action_url, created_at)
                        VALUES (gen_random_uuid(), :uid, 'New Episodes Available',
                                'New episodes may be available for a series you watch!',
                                'content', '/watch/' || :mid, NOW())
                        ON CONFLICT DO NOTHING
                    """), {"uid": str(su.user_id), "mid": su.moviebox_id})
                    notified += 1
                await db.commit()
            return SuccessResponse(success=True, message=f"Notified {notified} users about potential new episodes")
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=str(e))

