# pyright: reportCallIssue=false, reportArgumentType=false, reportGeneralTypeIssues=false, reportReturnType=false
"""User-facing queries: me, dashboard, watchlist, history, notifications, reviews, etc."""

import strawberry
import asyncio
from typing import List, Optional
from datetime import datetime, timedelta

from sqlalchemy.future import select

from app.services.movie_service import movie_service
from app.models.database import (
    User as DbUser, Watchlist as DbWatchlist, History as DbHistory,
    Notification as DbNotification, Report as DbReport, Review as DbReview,
    RecentlyViewed as DbRecentlyViewed, Subtitle as DbSubtitle,
    FamilyPlan as DbFamilyPlan, FamilyMember as DbFamilyMember,
)
from app.api.graphql.types import (
    User, Movie, Genre, Review, Report, Notification,
    WatchHistoryItem, DashboardData, UserDashboardStats,
    RecentlyViewed, ContinueWatching, LoginActivityEntry,
    NotificationPreferencesType, SessionEntry, SubtitleType,
    EmailPreferences, DownloadQuota, CustomList, CustomListItem,
    DateRangeInput, ChatMessageType,
)
from app.api.graphql.helpers import _sentry_capture, create_user_response, logger


@strawberry.type
class UserQueries:

    @strawberry.field
    async def me(self, info: strawberry.Info) -> Optional[User]:
        user = await info.context.user
        if not user:
            return None
        return create_user_response(user)

    @strawberry.field
    async def myReferralCode(self, info: strawberry.Info) -> Optional[str]:
        user = await info.context.user
        if not user:
            return None
        return str(user.id).replace("-", "")[:8].upper()

    @strawberry.field
    async def validateReferral(self, info: strawberry.Info, code: str) -> bool:
        db = await info.context.get_db()
        from sqlalchemy import func, cast, String
        safe_code = code.upper().strip()[:8]
        result = await db.execute(
            select(DbUser).where(
                func.upper(
                    func.substr(func.replace(cast(DbUser.id, String), "-", ""), 1, 8)
                ) == safe_code
            )
        )
        return result.scalars().first() is not None

    @strawberry.field
    async def movieReviews(self, info: strawberry.Info, movieId: str) -> List[Review]:
        db = await info.context.get_db()
        from sqlalchemy import desc
        result = await db.execute(
            select(DbReview).where(DbReview.moviebox_id == movieId)
            .order_by(desc(DbReview.created_at))
        )
        reviews = result.scalars().all()
        if not reviews:
            return []

        # Batch-fetch all review authors in ONE query (N+1 fix)
        author_ids = list({r.user_id for r in reviews})
        user_result = await db.execute(
            select(DbUser).where(DbUser.id.in_(author_ids))
        )
        user_map = {u.id: u for u in user_result.scalars().all()}

        out = []
        for r in reviews:
            u = user_map.get(r.user_id)
            out.append(Review(
                id=str(r.id), content=r.content, rating=r.rating,
                userName=u.name if u else "User", userAvatar=u.avatar if u else None,
                isFeatured=r.is_featured, createdAt=str(r.created_at)
            ))
        return out

    @strawberry.field
    async def watchHistory(self, info: strawberry.Info, limit: int = 50, offset: int = 0) -> List[WatchHistoryItem]:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        from app.models.database import History as DbHistoryModel, Movie as DbMovie, Series as DbSeries
        from sqlalchemy import desc
        items = []
        try:
            history_result = await db.execute(
                select(DbHistoryModel)
                .where(DbHistoryModel.user_id == user.id)
                .order_by(desc(DbHistoryModel.updated_at))
                .offset(offset).limit(limit)
            )
            history_rows = history_result.scalars().all()
            if not history_rows:
                return []

            # Batch-fetch all moviebox_ids from local DB in TWO queries (N+1 fix)
            all_mids = list({str(h.moviebox_id) for h in history_rows})

            movie_result = await db.execute(
                select(DbMovie).where(DbMovie.moviebox_id.in_(all_mids))
            )
            movie_map = {m.moviebox_id: m for m in movie_result.scalars().all()}

            series_result = await db.execute(
                select(DbSeries).where(DbSeries.moviebox_id.in_(all_mids))
            )
            series_map = {s.moviebox_id: s for s in series_result.scalars().all()}

            # Only fetch from API for items not in local DB (rare after first view)
            missing_mids = [mid for mid in all_mids if mid not in movie_map and mid not in series_map]
            api_map = {}
            if missing_mids:
                api_results = await asyncio.gather(
                    *[movie_service.get_details(mid, db=db) for mid in missing_mids[:5]],
                    return_exceptions=True
                )
                for mid, result in zip(missing_mids[:5], api_results):
                    if not isinstance(result, Exception) and result:
                        api_map[mid] = result

            for h in history_rows:
                mid = str(h.moviebox_id)
                title, poster = None, None

                if mid in movie_map:
                    title, poster = movie_map[mid].title, movie_map[mid].poster_url
                elif mid in series_map:
                    title, poster = series_map[mid].title, series_map[mid].poster_url
                elif mid in api_map:
                    title, poster = api_map[mid].title, api_map[mid].poster_url
                else:
                    title = f"Content #{mid[:8]}"

                progress = (h.current_time / h.duration * 100) if h.duration and h.duration > 0 else 0
                items.append(WatchHistoryItem(
                    id=str(h.id), movieboxId=mid, title=title, posterUrl=poster,
                    contentType=h.content_type or "movie",
                    currentTime=h.current_time or 0, duration=h.duration or 0,
                    progress=round(progress, 1),
                    watchedAt=str(h.updated_at) if h.updated_at else ""
                ))
        except Exception as e:
            _sentry_capture(e)
            logger.exception("Watch history error")
        return items

    @strawberry.field
    async def dashboardData(self, info: strawberry.Info) -> Optional[DashboardData]:
        user = await info.context.user
        if not user:
            return None
        db = await info.context.get_db()

        # ── Watchlist (only need first 10 for UI) ─────────────────
        watchlist_query = await db.execute(
            select(DbWatchlist).where(DbWatchlist.user_id == user.id).limit(10)
        )
        watchlist_items = watchlist_query.scalars().all()
        watchlist_movies = []
        if watchlist_items:
            movie_ids = [item.moviebox_id for item in watchlist_items]
            details_list = await asyncio.gather(*[movie_service.get_details(mid, db=db) for mid in movie_ids])
            for details in details_list:
                if not details:
                    continue
                watchlist_movies.append(Movie(
                    id=details.id, title=details.title, overview=details.description,
                    posterPath=details.poster_url, backdropPath=details.poster_url,
                    releaseDate=str(details.year) if details.year else None,
                    voteAverage=details.rating or 0.0,
                    genres=[Genre(id=str(i), name=g, slug=g.lower()) for i, g in enumerate(details.genres or [])],
                    runtime=details.duration or 0
                ))

        # ── Aggregate stats via SQL (avoids fetching ALL history rows) ──
        from sqlalchemy import func, text
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        stats_result = await db.execute(text("""
            SELECT
                COUNT(*) AS total_watched,
                COALESCE(SUM("current_time"), 0) AS total_seconds,
                COALESCE(SUM(CASE WHEN updated_at >= :month_start THEN "current_time" ELSE 0 END), 0) AS monthly_seconds
            FROM history
            WHERE user_id = :uid
        """), {"uid": str(user.id), "month_start": month_start})
        stats_row = stats_result.one()

        watchlist_count_result = await db.execute(text(
            "SELECT COUNT(*) AS cnt FROM watchlist WHERE user_id = :uid"
        ), {"uid": str(user.id)})
        watchlist_count = watchlist_count_result.scalar() or 0

        reviews_count_result = await db.execute(text(
            "SELECT COUNT(*) AS cnt FROM reviews WHERE user_id = :uid"
        ), {"uid": str(user.id)})
        reviews_count = reviews_count_result.scalar() or 0

        # ── Recent history (only 10 rows for UI cards) ────────────
        history_query = await db.execute(
            select(DbHistory).where(DbHistory.user_id == user.id)
            .order_by(DbHistory.updated_at.desc()).limit(10)
        )
        history_items = history_query.scalars().all()

        recent, continue_watching = [], []

        # ── N+1 fix: batch-fetch details for the first 10 items concurrently ──
        items_needing_details = history_items[:10]  # only need first 10 for recent + continue
        if items_needing_details:
            detail_results = await asyncio.gather(
                *[movie_service.get_details(item.moviebox_id, db=db) for item in items_needing_details],
                return_exceptions=True
            )
            for item, m_details in zip(items_needing_details, detail_results):
                if isinstance(m_details, Exception) or not m_details:
                    continue
                mapped_movie = Movie(
                    id=m_details.id, title=m_details.title, overview=m_details.description,
                    posterPath=m_details.poster_url, backdropPath=m_details.poster_url,
                    releaseDate=str(m_details.year) if m_details.year else None,
                    voteAverage=m_details.rating or 0.0
                )
                if len(recent) < 5:
                    recent.append(RecentlyViewed(
                        id=str(item.id), title=m_details.title,
                        posterUrl=m_details.poster_url, rating=m_details.rating or 0.0
                    ))
                if len(continue_watching) < 5 and item.current_time and item.duration and item.current_time < item.duration:
                    continue_watching.append(ContinueWatching(
                        id=str(item.id), movie=mapped_movie,
                        currentTime=item.current_time, duration=item.duration
                    ))

        return DashboardData(
            watchlist=watchlist_movies,
            recentlyViewed=recent,
            continueWatching=continue_watching,
            stats=UserDashboardStats(
                watchlistCount=watchlist_count,
                moviesWatched=int(stats_row.total_watched),
                totalWatchTime=int(stats_row.total_seconds) // 60,
                monthlyWatchTime=int(stats_row.monthly_seconds) // 60,
                reviewsWritten=reviews_count
            )
        )

    @strawberry.field
    async def notifications(self, info: strawberry.Info) -> List[Notification]:
        user = await info.context.user
        if not user:
            return []
        db = await info.context.get_db()
        q = await db.execute(
            select(DbNotification)
            .where(DbNotification.user_id == user.id)
            .order_by(DbNotification.created_at.desc())
            .limit(50)
        )
        return [
            Notification(
                id=str(n.id), title=n.title, message=n.message,
                type=n.type or "system", actionUrl=n.action_url,
                isRead=n.is_read, createdAt=str(n.created_at)
            )
            for n in q.scalars().all()
        ]

    @strawberry.field
    async def unreadNotificationCount(self, info: strawberry.Info) -> int:
        user = await info.context.user
        if not user:
            return 0
        db = await info.context.get_db()
        from sqlalchemy import func
        q = await db.execute(
            select(func.count(DbNotification.id)).where(
                DbNotification.user_id == user.id,
                DbNotification.is_read == False
            )
        )
        return q.scalar() or 0

    @strawberry.field
    async def landingReviews(self, info: strawberry.Info) -> List[Review]:
        db = await info.context.get_db()
        from sqlalchemy.orm import selectinload
        q = await db.execute(
            select(DbReview).options(selectinload(DbReview.user))
            .order_by(DbReview.created_at.desc()).limit(12)
        )
        return [
            Review(
                id=str(r.id), content=r.content, rating=r.rating,
                userName=r.user.name if r.user else "Anonymous",
                userAvatar=r.user.avatar if r.user else None,
                isFeatured=r.is_featured, createdAt=str(r.created_at)
            )
            for r in q.scalars().all()
        ]

    @strawberry.field
    async def getReports(self, info: strawberry.Info) -> List[Report]:
        user = await info.context.user
        if not user or user.role != "admin":
            return []
        db = await info.context.get_db()
        q = await db.execute(select(DbReport).order_by(DbReport.created_at.desc()))
        return [
            Report(id=str(r.id), reason=r.reason, description=r.description,
                   status=r.status, createdAt=str(r.created_at))
            for r in q.scalars().all()
        ]

    @strawberry.field
    async def chatMessages(self, info: strawberry.Info, room: Optional[str] = "global", limit: Optional[int] = 50, before: Optional[str] = None) -> List[ChatMessageType]:
        from app.models.database import ChatMessage as DbChatMessage
        db = await info.context.get_db()
        query = (
            select(DbChatMessage, DbUser.name, DbUser.avatar)
            .join(DbUser, DbChatMessage.user_id == DbUser.id)
            .where(DbChatMessage.room == (room or "global"))
            .order_by(DbChatMessage.created_at.desc())
            .limit(limit or 50)
        )
        if before:
            query = query.where(DbChatMessage.created_at < before)
        rows = (await db.execute(query)).all()
        return [
            ChatMessageType(
                id=str(row[0].id), userId=str(row[0].user_id),
                userName=row[1] or "User", userAvatar=row[2],
                room=row[0].room, content=row[0].content, createdAt=str(row[0].created_at)
            )
            for row in reversed(rows)
        ]

    @strawberry.field
    async def loginActivity(self, info: strawberry.Info, limit: Optional[int] = 20) -> List[LoginActivityEntry]:
        user = await info.context.user
        if not user:
            return []
        db = await info.context.get_db()
        from sqlalchemy import text
        try:
            result = await db.execute(text(
                "SELECT id, action, COALESCE(device_info, user_agent) as device_info, "
                "ip_address, location, success, created_at "
                "FROM login_activity WHERE user_id = :uid ORDER BY created_at DESC LIMIT :lim"
            ), {"uid": str(user.id), "lim": limit or 20})
            return [
                LoginActivityEntry(
                    id=str(r[0]), action=r[1] or "login", deviceInfo=r[2],
                    ipAddress=r[3], location=r[4],
                    success=r[5] if r[5] is not None else True,
                    createdAt=str(r[6]) if r[6] else ""
                )
                for r in result.fetchall()
            ]
        except Exception as e:
            _sentry_capture(e)
            logger.exception("Login activity query error")
            return []

    # ── Notification Preferences ───────────────────────────
    @strawberry.field
    async def myNotificationPreferences(self, info: strawberry.Info) -> NotificationPreferencesType:
        user = await info.context.user
        if not user:
            return NotificationPreferencesType()
        prefs = user.preferences or {}
        np = prefs.get("notification_preferences", {})
        return NotificationPreferencesType(
            newRelease=np.get("newRelease", True),
            watchlist=np.get("watchlist", True),
            recommendations=np.get("recommendations", True),
            accountActivity=np.get("accountActivity", True),
            promotions=np.get("promotions", False),
            socialUpdates=np.get("socialUpdates", True),
            downloadComplete=np.get("downloadComplete", True),
        )

    # ── User-facing session management ─────────────────────
    @strawberry.field
    async def mySessions(self, info: strawberry.Info) -> List[SessionEntry]:
        """List active sessions for the current user."""
        user = await info.context.user
        if not user:
            return []
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        # Try to identify the current token to mark it
        current_token_hash = None
        try:
            request = info.context.request
            raw_token = request.cookies.get("refresh_token")
            if raw_token:
                import hashlib
                current_token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        except Exception:
            pass  # Non-critical: session matching is best-effort

        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(text("""
                    SELECT id, device_info, ip_address, created_at, expires_at, token_hash
                    FROM refresh_tokens
                    WHERE user_id = :uid AND is_revoked = FALSE AND expires_at > NOW()
                    ORDER BY created_at DESC
                """), {"uid": str(user.id)})
                rows = result.fetchall()
                return [
                    SessionEntry(
                        id=str(r[0]),
                        deviceInfo=r[1] or "Unknown device",
                        ipAddress=r[2] or "Unknown",
                        lastActive=str(r[3]) if r[3] else "",
                        createdAt=str(r[3]) if r[3] else "",
                        isCurrent=(r[5] == current_token_hash) if current_token_hash else False,
                    )
                    for r in rows
                ]
        except Exception as e:
            _sentry_capture(e)
            logger.exception("[mySessions] error")
            return []

    # ── Subtitles ──────────────────────────────────────────
    @strawberry.field
    async def subtitlesForContent(
        self, movieboxId: str, season: Optional[int] = None, episode: Optional[int] = None,
    ) -> List[SubtitleType]:
        from app.core.database import AsyncSessionLocal
        try:
            async with AsyncSessionLocal() as db:
                q = select(DbSubtitle).where(DbSubtitle.moviebox_id == movieboxId)
                if season is not None:
                    q = q.where(DbSubtitle.season == season)
                if episode is not None:
                    q = q.where(DbSubtitle.episode == episode)
                rows = (await db.execute(q)).scalars().all()
                return [SubtitleType(
                    id=strawberry.ID(str(r.id)), movieboxId=r.moviebox_id,
                    contentType=r.content_type or "movie", language=r.language or "en",
                    label=r.label or "English", format=r.format or "vtt",
                    fileUrl=r.file_url or "", season=r.season, episode=r.episode,
                    createdAt=str(r.created_at) if r.created_at else None,
                ) for r in rows]
        except Exception as e:
            _sentry_capture(e)
            logger.exception("[subtitlesForContent] error")
            return []

    # ── Subscription & Payment queries ────
    @strawberry.field
    async def mySubscription(self, info: strawberry.Info) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        return {
            "tier": getattr(user, "subscription_tier", "free") or "free",
            "expiresAt": str(user.subscription_expires_at) if getattr(user, "subscription_expires_at", None) else None,
            "emailVerified": getattr(user, "email_verified", False),
            "referralCount": getattr(user, "referral_count", 0) or 0,
        }

    @strawberry.field
    async def myFamilyPlan(self, info: strawberry.Info) -> Optional[strawberry.scalars.JSON]:
        """Return the authenticated user's family plan with members."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        plan = (await db.execute(
            select(DbFamilyPlan).where(DbFamilyPlan.parent_id == user.id)
        )).scalars().first()
        if not plan:
            return None
        members_rows = (await db.execute(
            select(DbFamilyMember).where(DbFamilyMember.family_plan_id == plan.id)
        )).scalars().all()
        members = []
        for m in members_rows:
            member_user = (await db.execute(
                select(DbUser).where(DbUser.id == m.user_id)
            )).scalars().first()
            members.append({
                "id": str(m.id),
                "userId": str(m.user_id),
                "name": member_user.name if member_user else None,
                "email": member_user.email if member_user else None,
                "avatar": member_user.avatar if member_user else None,
                "role": m.role,
                "joinedAt": str(m.joined_at) if m.joined_at else "",
            })
        return {
            "id": str(plan.id),
            "inviteCode": plan.invite_code,
            "memberSlots": plan.member_slots,
            "isActive": plan.is_active,
            "createdAt": str(plan.created_at) if plan.created_at else "",
            "members": members,
        }

    @strawberry.field
    async def myPaymentHistory(self, info: strawberry.Info) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        from sqlalchemy import text
        try:
            result = await db.execute(text(
                "SELECT id, amount, currency, status, plan, payment_method, paid_at, created_at "
                "FROM payment_history WHERE user_id = :uid ORDER BY created_at DESC LIMIT 20"
            ), {"uid": str(user.id)})
            return {
                "payments": [
                    {"id": str(r[0]), "amount": r[1], "currency": r[2], "status": r[3],
                     "plan": r[4], "method": r[5],
                     "paidAt": str(r[6]) if r[6] else None, "createdAt": str(r[7]) if r[7] else None}
                    for r in result.fetchall()
                ]
            }
        except Exception as e:
            _sentry_capture(e)
            logger.exception("Payment history error")
            return {"payments": []}

    # ─── Section 11: Email Preferences Query ────────────────────
    @strawberry.field
    async def myEmailPreferences(self, info: strawberry.Info) -> EmailPreferences:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                row = (await db.execute(text("""
                    SELECT preferences FROM users WHERE id = :uid
                """), {"uid": str(user.id)})).fetchone()
                if row and row.preferences and isinstance(row.preferences, dict):
                    ep = row.preferences.get("emailPreferences", {})
                    return EmailPreferences(
                        marketing=ep.get("marketing", True),
                        security=ep.get("security", True),
                        newReleases=ep.get("newReleases", True),
                        watchlistUpdates=ep.get("watchlistUpdates", True),
                        weeklyDigest=ep.get("weeklyDigest", True),
                        socialActivity=ep.get("socialActivity", True),
                        accountAlerts=ep.get("accountAlerts", True),
                    )
        except Exception as e:
            _sentry_capture(e)
        return EmailPreferences()

    # ─── Section 12: Download Quota Query ───────────────────────
    @strawberry.field
    async def myDownloadQuota(self, info: strawberry.Info) -> DownloadQuota:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        tier_limits = {"free": 5, "standard": 25, "pro": 100}
        try:
            async with AsyncSessionLocal() as db:
                row = (await db.execute(text("""
                    SELECT subscription_tier FROM users WHERE id = :uid
                """), {"uid": str(user.id)})).fetchone()
                tier = row.subscription_tier if row else "free"
                # Count active downloads (last 30 days)
                count_r = (await db.execute(text("""
                    SELECT count(*) as cnt FROM history
                    WHERE user_id = :uid AND updated_at >= NOW() - INTERVAL '30 days'
                """), {"uid": str(user.id)})).fetchone()
                used = count_r.cnt if count_r else 0
                return DownloadQuota(
                    used=used,
                    limit=tier_limits.get(tier, 5),
                    tier=tier,
                    remainingStorage=0.0  # Client-side only
                )
        except Exception as e:
            _sentry_capture(e)
        return DownloadQuota()

    # ═══════════════════════════════════════════════════════════
    # Custom Lists / Letterboxd-style (Section 13)
    # ═══════════════════════════════════════════════════════════

    @strawberry.field
    async def myCustomLists(self, info: strawberry.Info) -> List[CustomList]:
        """Retrieve user's custom lists."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                lists_rows = (await db.execute(text("""
                    SELECT * FROM custom_lists WHERE user_id = :uid ORDER BY updated_at DESC
                """), {"uid": str(user.id)})).fetchall()
                result = []
                for lr in lists_rows:
                    items_rows = (await db.execute(text("""
                        SELECT moviebox_id, title, poster_url, added_at
                        FROM custom_list_items WHERE list_id = :lid ORDER BY added_at DESC
                    """), {"lid": str(lr.id)})).fetchall()
                    result.append(CustomList(
                        id=str(lr.id), userId=str(lr.user_id),
                        name=lr.name, description=lr.description,
                        isPublic=lr.is_public,
                        items=[CustomListItem(
                            movieboxId=ir.moviebox_id, title=ir.title or "",
                            posterUrl=ir.poster_url, addedAt=str(ir.added_at),
                        ) for ir in items_rows],
                        createdAt=str(lr.created_at), updatedAt=str(lr.updated_at),
                    ))
                return result
        except Exception as e:
            _sentry_capture(e)
            return []
