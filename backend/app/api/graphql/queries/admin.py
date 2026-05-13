# pyright: reportCallIssue=false, reportArgumentType=false, reportGeneralTypeIssues=false, reportReturnType=false
"""Admin queries: dashboardStats, adminUsers, adminReports, auditLogs, flags, etc."""

import strawberry
import asyncio
from typing import List, Optional
from datetime import datetime, timedelta

from sqlalchemy.future import select

from app.services.movie_service import movie_service
from app.models.database import (
    User as DbUser, Watchlist as DbWatchlist, History as DbHistory,
    Notification as DbNotification,
)
from app.api.graphql.types import (
    AdminDashboardStats, GrowthPoint, TopMovieStat, GenreDistribution,
    Genre, ActivityLog, AdminUser, AdminUsersResponse, Notification,
    LoginActivityEntry, PremiumSignupStats, ReferralDashboard, ReferralEntry,
    AdminAuditLogEntry, FeatureFlag, ContentScheduleEntry,
    SystemHealthResponse, DateRangeInput, Movie,
)
from app.api.graphql.helpers import _sentry_capture, logger


@strawberry.type
class AdminQueries:

    async def dashboardStats(self, info: strawberry.Info, dateRange: Optional[DateRangeInput] = None) -> AdminDashboardStats:
        from sqlalchemy import func, text
        try:
            db = await info.context.get_db()
            now = datetime.utcnow()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_start = today_start - timedelta(days=7)

            counts_sql = text("""
                SELECT
                    (SELECT count(*) FROM users) AS total_users,
                    (SELECT count(*) FROM movies) AS total_movies,
                    (SELECT count(*) FROM series) AS total_series,
                    (SELECT count(*) FROM users WHERE created_at >= :today) AS new_today,
                    (SELECT count(*) FROM users WHERE created_at >= :week) AS new_week,
                    (SELECT count(DISTINCT user_id) FROM history WHERE updated_at >= :week) AS active_users,
                    (SELECT count(*) FROM watchlist) AS total_watchlist,
                    (SELECT coalesce(avg(h."current_time"), 0) FROM history h WHERE h."current_time" > 0) AS avg_duration
            """)
            result = await db.execute(counts_sql, {"today": today_start, "week": week_start})
            row = result.one()

            avg_secs = int(row.avg_duration or 0)
            avg_h, avg_m = avg_secs // 3600, (avg_secs % 3600) // 60
            avg_session_str = f"{avg_h}h {avg_m}m" if avg_h > 0 else f"{avg_m}m"

            thirty_days_ago = today_start - timedelta(days=30)

            # ΓöÇΓöÇ Run independent queries concurrently ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
            import asyncio

            async def _query_growth():
                return (await db.execute(
                    select(func.date(DbUser.created_at).label("day"), func.count(DbUser.id).label("cnt"))
                    .where(DbUser.created_at >= thirty_days_ago)
                    .group_by(func.date(DbUser.created_at))
                    .order_by(func.date(DbUser.created_at))
                )).all()

            async def _query_recent_notifs():
                return (await db.execute(
                    select(DbNotification).order_by(DbNotification.created_at.desc()).limit(20)
                )).scalars().all()

            async def _query_top_movies():
                try:
                    rows = (await db.execute(text("""
                        SELECT moviebox_id, title, COUNT(*) AS view_count
                        FROM movie_views
                        WHERE viewed_at >= :week
                        GROUP BY moviebox_id, title
                        ORDER BY view_count DESC
                        LIMIT 5
                    """), {"week": week_start})).fetchall()
                    return [
                        TopMovieStat(title=tr.title or tr.moviebox_id, views=tr.view_count or 0, downloads=0, watchlistAdds=0)
                        for tr in rows
                    ]
                except Exception as e:
                    _sentry_capture(e)
                    logger.exception("[dashboardStats] topMovies error")
                    return []

            async def _query_genre_dist():
                try:
                    rows = (await db.execute(text("""
                        SELECT genre, COUNT(*) AS view_count
                        FROM movie_views
                        WHERE genre IS NOT NULL AND genre != ''
                        GROUP BY genre
                        ORDER BY view_count DESC
                        LIMIT 10
                    """))).fetchall()
                    return [
                        GenreDistribution(genre=Genre(name=gr.genre, slug=gr.genre.lower().replace(" ", "-")), movieCount=0, viewCount=gr.view_count or 0)
                        for gr in rows
                    ]
                except Exception as e:
                    _sentry_capture(e)
                    logger.exception("[dashboardStats] genreDistribution error")
                    return []

            growth_rows, recent_notifs, top_movies, genre_dist = await asyncio.gather(
                _query_growth(), _query_recent_notifs(), _query_top_movies(), _query_genre_dist()
            )

            return AdminDashboardStats(
                totalUsers=row.total_users or 0,
                totalMovies=(row.total_movies or 0) + (row.total_series or 0),
                totalGenres=14,
                activeUsers=row.active_users or 0,
                newUsersToday=row.new_today or 0,
                newUsersThisWeek=row.new_week or 0,
                totalDownloads=0,
                totalWatchlistItems=row.total_watchlist or 0,
                avgSessionDuration=avg_session_str,
                userGrowth=[GrowthPoint(date=str(r.day), count=r.cnt) for r in growth_rows],
                genreDistribution=genre_dist,
                topMovies=top_movies,
                recentActivity=[
                    ActivityLog(id=str(n.id), type=n.type or "system",
                                description=f"{n.title}: {n.message[:80]}",
                                timestamp=str(n.created_at))
                    for n in recent_notifs
                ]
            )
        except Exception as e:
            _sentry_capture(e)
            logger.exception("[dashboardStats] Error")
            return AdminDashboardStats(
                totalUsers=0, totalMovies=0, totalGenres=14, activeUsers=0,
                newUsersToday=0, newUsersThisWeek=0, totalDownloads=0,
                totalWatchlistItems=0, avgSessionDuration="0m",
                userGrowth=[], genreDistribution=[], topMovies=[], recentActivity=[]
            )

    async def adminUsers(self, info: strawberry.Info, limit: Optional[int] = 20, offset: Optional[int] = 0, search: Optional[str] = None, status: Optional[str] = None) -> AdminUsersResponse:
        from sqlalchemy import func
        db = await info.context.get_db()
        query = select(DbUser)
        count_query = select(func.count(DbUser.id))
        if search:
            search_term = f"%{search}%"
            cond = (DbUser.email.ilike(search_term)) | (DbUser.name.ilike(search_term))
            query = query.where(cond)
            count_query = count_query.where(cond)
        total_count = (await db.execute(count_query)).scalar() or 0
        query = query.order_by(DbUser.created_at.desc()).offset(offset or 0).limit(limit or 20)
        db_users = (await db.execute(query)).scalars().all()
        users = []
        for u in db_users:
            wl_count = (await db.execute(select(func.count(DbWatchlist.id)).where(DbWatchlist.user_id == u.id))).scalar() or 0
            last_hist = (await db.execute(
                select(DbHistory.updated_at).where(DbHistory.user_id == u.id)
                .order_by(DbHistory.updated_at.desc()).limit(1)
            )).scalar()
            name_parts = (u.name or "").split(" ", 1)
            users.append(AdminUser(
                id=str(u.id), email=u.email, username=u.email.split("@")[0],
                firstName=name_parts[0] if name_parts else "",
                lastName=name_parts[1] if len(name_parts) > 1 else "",
                avatar=u.avatar, isActive=True, isBanned=getattr(u, 'is_banned', False) or False,
                lastActive=str(last_hist) if last_hist else None,
                createdAt=str(u.created_at) if u.created_at else None,
                watchlistCount=wl_count, downloadCount=0
            ))
        return AdminUsersResponse(users=users, totalCount=total_count)

    async def adminUserDetail(self, info: strawberry.Info, id: strawberry.ID) -> AdminUser:
        user = await info.context.user
        if not user or user.role != "admin":
            raise ValueError("Admin access required")
        from sqlalchemy import func
        db = await info.context.get_db()
        u = (await db.execute(select(DbUser).where(DbUser.id == id))).scalars().first()
        if not u:
            raise ValueError("User not found")
        wl_count = (await db.execute(select(func.count()).where(DbWatchlist.user_id == u.id))).scalar() or 0
        return AdminUser(
            id=str(u.id), email=u.email, username=u.name,
            firstName=u.name.split(' ')[0] if u.name else '',
            lastName=' '.join(u.name.split(' ')[1:]) if u.name and ' ' in u.name else '',
            avatar=u.avatar, isActive=True, isBanned=getattr(u, 'is_banned', False) or False,
            lastActive=str(u.created_at), createdAt=str(u.created_at),
            watchlistCount=wl_count, downloadCount=0
        )

    async def adminNotifications(self, info: strawberry.Info, limit: Optional[int] = 50) -> List[Notification]:
        user = await info.context.user
        if not user or user.role != "admin":
            raise ValueError("Admin access required")
        db = await info.context.get_db()
        notifs = (await db.execute(
            select(DbNotification).order_by(DbNotification.created_at.desc()).limit(limit or 50)
        )).scalars().all()
        return [
            Notification(
                id=str(n.id), title=n.title, message=n.message,
                type=n.type or "system", actionUrl=n.action_url,
                isRead=n.is_read, createdAt=str(n.created_at)
            )
            for n in notifs
        ]

    async def adminLoginActivity(self, info: strawberry.Info, limit: Optional[int] = 50) -> List[LoginActivityEntry]:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            try:
                result = await db.execute(text("""
                    SELECT la.id, la.action, la.user_agent, la.ip_address,
                           COALESCE(u.email, 'unknown') as location,
                           la.success, la.created_at
                    FROM login_activity la
                    LEFT JOIN users u ON u.id = la.user_id
                    ORDER BY la.created_at DESC
                    LIMIT :lim
                """), {"lim": limit or 50})
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
                logger.exception("adminLoginActivity error")
                return []

    async def adminActiveSessions(self, info: strawberry.Info) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            try:
                result = await db.execute(text("""
                    SELECT rt.id, COALESCE(u.email, 'unknown') as email,
                           rt.device_info, rt.ip_address, rt.created_at, rt.expires_at
                    FROM refresh_tokens rt
                    JOIN users u ON u.id = rt.user_id
                    WHERE rt.is_revoked = FALSE AND rt.expires_at > NOW()
                    ORDER BY rt.created_at DESC
                    LIMIT 100
                """))
                rows = result.fetchall()
                return [
                    {
                        "id": str(r[0]), "user": r[1] or "unknown",
                        "device": r[2] or "Unknown device", "ip": r[3] or "unknown",
                        "location": "", "lastActive": str(r[4]) if r[4] else "",
                        "active": True
                    }
                    for r in rows
                ]
            except Exception as e:
                _sentry_capture(e)
                logger.exception("adminActiveSessions error")
                return []

    async def revenueStats(self, info: strawberry.Info, days: Optional[int] = 30) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            try:
                # Count subscribers by tier
                tier_result = await db.execute(text("""
                    SELECT subscription_tier, COUNT(*) as cnt
                    FROM users GROUP BY subscription_tier
                """))
                tiers = {"free": 0, "standard": 0, "pro": 0}
                total_subs = 0
                for r in tier_result.fetchall():
                    tier = (r[0] or "free").lower()
                    if tier in tiers:
                        tiers[tier] = r[1]
                    total_subs += r[1]

                paid = tiers["standard"] + tiers["pro"]
                mrr = tiers["standard"] * 3000 + tiers["pro"] * 8000
                arr = mrr * 12

                # Recent payments from payment_history (if table exists)
                recent_payments = []
                failed_payments = []
                try:
                    ph_result = await db.execute(text("""
                        SELECT ph.id, u.email, ph.amount, ph.plan, ph.status, ph.created_at, ph.reference
                        FROM payment_history ph
                        LEFT JOIN users u ON u.id = ph.user_id
                        ORDER BY ph.created_at DESC LIMIT 20
                    """))
                    for r in ph_result.fetchall():
                        entry = {
                            "id": str(r[0]), "user": r[1] or "unknown", "amount": r[2] or 0,
                            "plan": r[3] or "unknown", "status": r[4] or "paid",
                            "date": str(r[5])[:10] if r[5] else "", "reference": r[6] or ""
                        }
                        if entry["status"] == "failed":
                            entry["attempts"] = 1
                            failed_payments.append(entry)
                        else:
                            recent_payments.append(entry)
                except Exception as e:
                    logger.debug(f"payment_history table query skipped: {e}")

                # Growth: monthly user count over last 6 months
                growth = []
                try:
                    gr = await db.execute(text("""
                        SELECT TO_CHAR(created_at, 'Mon') as month, COUNT(*) as cnt
                        FROM users
                        WHERE created_at >= NOW() - INTERVAL '6 months'
                        GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
                        ORDER BY DATE_TRUNC('month', created_at)
                    """))
                    for r in gr.fetchall():
                        growth.append({"month": r[0], "value": r[1]})
                except Exception as e:
                    logger.debug(f"User growth query failed: {e}")

                return {
                    "mrr": mrr, "arr": arr,
                    "totalSubscribers": total_subs,
                    "churnRate": 0.0,
                    "tiers": tiers,
                    "growth": growth if growth else [{"month": "Now", "value": total_subs}],
                    "recentPayments": recent_payments[:10],
                    "failedPayments": failed_payments[:10],
                    "methodBreakdown": [
                        {"method": "Card", "percentage": 100, "amount": mrr}
                    ]
                }
            except Exception as e:
                _sentry_capture(e)
                logger.exception("revenueStats error")
                return {"mrr": 0, "arr": 0, "totalSubscribers": 0, "churnRate": 0,
                        "tiers": {"free": 0, "standard": 0, "pro": 0}, "growth": [],
                        "recentPayments": [], "failedPayments": [], "methodBreakdown": []}

    async def adminAllReviews(self, info: strawberry.Info, limit: Optional[int] = 50, offset: Optional[int] = 0, filter: Optional[str] = None) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            try:
                where_clause = ""
                if filter == "flagged":
                    where_clause = "HAVING COALESCE(rr.report_count, 0) > 0"
                elif filter == "featured":
                    where_clause = "WHERE r.is_featured = TRUE"

                q = f"""
                    SELECT r.id, r.content, r.rating, r.is_featured, r.created_at,
                           u.name as user_name, u.avatar as user_avatar,
                           r.moviebox_id,
                           COALESCE(rr.report_count, 0) as report_count
                    FROM reviews r
                    LEFT JOIN users u ON u.id = r.user_id
                    LEFT JOIN (
                        SELECT review_id, COUNT(*) as report_count
                        FROM review_reports GROUP BY review_id
                    ) rr ON rr.review_id = r.id
                    {"WHERE r.is_featured = TRUE" if filter == "featured" else ""}
                    ORDER BY COALESCE(rr.report_count, 0) DESC, r.created_at DESC
                    LIMIT :lim OFFSET :off
                """
                result = await db.execute(text(q), {"lim": limit or 50, "off": offset or 0})
                rows = result.fetchall()

                counts = await db.execute(text("""
                    SELECT COUNT(*) as total,
                           SUM(CASE WHEN rr.rc > 0 THEN 1 ELSE 0 END) as flagged,
                           SUM(CASE WHEN r.is_featured THEN 1 ELSE 0 END) as featured
                    FROM reviews r
                    LEFT JOIN (SELECT review_id, COUNT(*) as rc FROM review_reports GROUP BY review_id) rr ON rr.review_id = r.id
                """))
                c = counts.fetchone()

                reviews = [
                    {
                        "id": str(r[0]), "content": r[1] or "",
                        "rating": float(r[2]) if r[2] else None,
                        "isFeatured": bool(r[3]),
                        "createdAt": str(r[4]) if r[4] else "",
                        "userName": r[5], "userAvatar": r[6],
                        "movieboxId": r[7],
                        "reportCount": int(r[8] or 0),
                    }
                    for r in rows
                ]
                return {
                    "reviews": reviews,
                    "totalCount": int(c[0] or 0) if c else 0,
                    "flaggedCount": int(c[1] or 0) if c else 0,
                    "featuredCount": int(c[2] or 0) if c else 0,
                }
            except Exception as e:
                _sentry_capture(e)
                logger.exception("adminAllReviews error")
                return {"reviews": [], "totalCount": 0, "flaggedCount": 0, "featuredCount": 0}

    async def adminContentList(self, info: strawberry.Info, limit: Optional[int] = 50, search: Optional[str] = None) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            try:
                items = []
                # Movies
                mq = "SELECT id, title, poster_url, release_year, rating, moviebox_id FROM movies"
                if search:
                    mq += " WHERE title ILIKE :s"
                mq += " ORDER BY id DESC LIMIT :lim"
                params = {"lim": limit or 50}
                if search:
                    params["s"] = f"%{search}%"
                result = await db.execute(text(mq), params)
                for r in result.fetchall():
                    items.append({
                        "id": str(r[0]), "title": r[1] or "Untitled", "type": "movie",
                        "poster": r[2] or "", "year": r[3] or "",
                        "rating": float(r[4]) if r[4] else 0, "tier": "free",
                        "status": "published", "trending": False, "featured": False,
                        "views": 0, "bookmarks": 0,
                    })
                # Series
                sq = "SELECT id, title, poster_url, release_year, rating, moviebox_id FROM series"
                if search:
                    sq += " WHERE title ILIKE :s"
                sq += " ORDER BY id DESC LIMIT :lim"
                result2 = await db.execute(text(sq), params)
                for r in result2.fetchall():
                    items.append({
                        "id": str(r[0]), "title": r[1] or "Untitled", "type": "series",
                        "poster": r[2] or "", "year": r[3] or "",
                        "rating": float(r[4]) if r[4] else 0, "tier": "free",
                        "status": "published", "trending": False, "featured": False,
                        "views": 0, "bookmarks": 0,
                    })
                return items
            except Exception as e:
                _sentry_capture(e)
                logger.exception("adminContentList error")
                return []

    async def premiumSignupStats(self) -> PremiumSignupStats:
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                total_premium = (await db.execute(
                    text("SELECT count(*) FROM users WHERE subscription_tier != 'free'")
                )).scalar() or 0
                remaining = max(0, 50 - total_premium)
                return PremiumSignupStats(
                    totalPremiumUsers=total_premium, remainingSlots=remaining,
                    isEligible=remaining > 0, isActive=remaining > 0
                )
        except Exception as e:
            _sentry_capture(e)
            logger.exception("Premium stats error")
            return PremiumSignupStats()

    async def adminReferralDashboard(self, info: strawberry.Info) -> ReferralDashboard:
        user = await info.context.user
        if not user or user.role != "admin":
            raise Exception("Admin only")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                rows = (await db.execute(
                    text("SELECT id, email, name, referral_count, subscription_tier, created_at FROM users WHERE referral_count > 0 ORDER BY referral_count DESC LIMIT 100")
                )).fetchall()
                entries = []
                total = 0
                premium = 0
                for r in rows:
                    total += r.referral_count or 0
                    if r.subscription_tier and r.subscription_tier != "free":
                        premium += 1
                    entries.append(ReferralEntry(
                        id=strawberry.ID(str(r.id)), email=r.email or "",
                        name=r.name, joinedAt=str(r.created_at) if r.created_at else None,
                        subscriptionTier=r.subscription_tier or "free",
                    ))
                return ReferralDashboard(
                    totalReferrals=total, activeReferrals=len(entries),
                    premiumConversions=premium, referrals=entries,
                )
        except Exception as e:
            _sentry_capture(e)
            logger.exception("[adminReferralDashboard] error")
            return ReferralDashboard()

    async def revenueExportCsv(self, info: strawberry.Info, days: Optional[int] = 90) -> str:
        """Generate a CSV of revenue data for the specified time window. Returns CSV as a string."""
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        import csv, io
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(text("""
                    SELECT ph.id, u.email, ph.amount, ph.currency, ph.plan,
                           ph.status, ph.payment_method, ph.paid_at, ph.created_at,
                           ph.paystack_reference
                    FROM payment_history ph
                    LEFT JOIN users u ON u.id = ph.user_id
                    WHERE ph.created_at >= NOW() - MAKE_INTERVAL(days => :days)
                    ORDER BY ph.created_at DESC
                """), {"days": days or 90})
                rows = result.fetchall()

                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(["ID", "Email", "Amount", "Currency", "Plan",
                                 "Status", "Method", "PaidAt", "CreatedAt", "Reference"])
                for r in rows:
                    writer.writerow([
                        str(r[0]), r[1] or "", r[2] or 0, r[3] or "NGN", r[4] or "",
                        r[5] or "", r[6] or "", str(r[7]) if r[7] else "",
                        str(r[8]) if r[8] else "", r[9] or ""
                    ])
                return output.getvalue()
        except Exception as e:
            _sentry_capture(e)
            logger.exception("[revenueExportCsv] error")
            return "Error generating CSV: " + str(e)

    async def systemHealth(self, info: strawberry.Info) -> SystemHealthResponse:
        """Live system health ΓÇö parsed from real service checks, not hardcoded."""
        import os
        from datetime import datetime as dt
        db_status = "unknown"
        movie_status = "unknown"
        redis_status = "unknown"
        overall = "healthy"

        # Database check
        try:
            from app.core.database import AsyncSessionLocal
            from sqlalchemy import text as sa_text
            async with AsyncSessionLocal() as db:
                await db.execute(sa_text("SELECT 1"))
            db_status = "up"
        except Exception:
            db_status = "down"
            overall = "degraded"

        # Movie provider check
        try:
            if movie_service and movie_service.provider:
                movie_status = "up"
            else:
                movie_status = "not initialized"
                overall = "degraded"
        except Exception:
            movie_status = "down"
            overall = "degraded"

        # Redis check
        try:
            from app.core.cache import cache
            redis_ok = await cache._ensure_connected()
            redis_status = "up" if redis_ok else "down"
            if not redis_ok:
                overall = "degraded"
        except Exception:
            redis_status = "unavailable"

        return SystemHealthResponse(
            status=overall,
            timestamp=dt.utcnow().isoformat(),
            version=os.getenv("APP_VERSION", "2.0.0"),
            database=db_status,
            movieProvider=movie_status,
            redis=redis_status,
        )

    async def adminAuditLogs(self, info: strawberry.Info, limit: int = 50) -> List[AdminAuditLogEntry]:
        """Retrieve admin audit log entries ΓÇö admin only."""
        user = await info.context.user
        if not user or user.role != "admin":
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                rows = (await db.execute(text("""
                    SELECT a.id, a.admin_id, a.action, a.target_type, a.target_id,
                           a.details, a.ip_address, a.created_at, u.email AS admin_email
                    FROM admin_audit_log a
                    LEFT JOIN users u ON u.id = a.admin_id
                    ORDER BY a.created_at DESC
                    LIMIT :lim
                """), {"lim": limit})).fetchall()
                return [
                    AdminAuditLogEntry(
                        id=str(r.id), adminId=str(r.admin_id), adminEmail=r.admin_email or "",
                        action=r.action, targetType=r.target_type or "",
                        targetId=str(r.target_id) if r.target_id else "",
                        details=r.details, ipAddress=r.ip_address,
                        createdAt=str(r.created_at),
                    )
                    for r in rows
                ]
        except Exception as e:
            _sentry_capture(e)
            return []

    async def featureFlags(self, info: strawberry.Info) -> List[FeatureFlag]:
        """Retrieve all feature flags. Admin sees all, users see enabled ones."""
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        user = await info.context.user
        is_admin = user and user.role == "admin"
        try:
            async with AsyncSessionLocal() as db:
                if is_admin:
                    rows = (await db.execute(text(
                        "SELECT * FROM feature_flags ORDER BY key"
                    ))).fetchall()
                else:
                    rows = (await db.execute(text(
                        "SELECT * FROM feature_flags WHERE enabled = true ORDER BY key"
                    ))).fetchall()
                return [
                    FeatureFlag(
                        id=str(r.id), key=r.key, label=r.label or r.key,
                        enabled=r.enabled, description=r.description,
                        updatedAt=str(r.updated_at) if r.updated_at else "",
                        updatedBy=str(r.updated_by) if r.updated_by else None,
                    )
                    for r in rows
                ]
        except Exception as e:
            _sentry_capture(e)
            # Return default flags if table doesn't exist yet
            defaults = [
                ("watch_party_enabled", "Watch Party", True),
                ("downloads_enabled", "Downloads", True),
                ("ai_assistant_enabled", "AI Assistant", True),
                ("reviews_enabled", "Reviews", True),
            ]
            return [FeatureFlag(id=str(i), key=k, label=l, enabled=e) for i, (k, l, e) in enumerate(defaults)]

    async def contentSchedule(self, info: strawberry.Info, limit: int = 20) -> List[ContentScheduleEntry]:
        user = await info.context.user
        if not user or getattr(user, 'role', 'user') != 'admin':
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                rows = (await db.execute(text("""
                    SELECT id, moviebox_id, title, publish_at, status, created_by
                    FROM content_schedule
                    ORDER BY publish_at ASC LIMIT :lim
                """), {"lim": limit})).fetchall()
                return [ContentScheduleEntry(
                    id=str(r.id), movieboxId=r.moviebox_id, title=r.title or "",
                    publishAt=str(r.publish_at), status=r.status or "scheduled",
                    createdBy=r.created_by or ""
                ) for r in rows]
        except Exception as e:
            _sentry_capture(e)
            return []

