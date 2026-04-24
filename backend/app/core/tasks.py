
import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.core.email_service import (
    send_renewal_warning_email,
    send_subscription_email,
    send_grace_period_email,
)

logger = logging.getLogger("clipx")

async def enforce_grace_periods():
    """
    Downgrade users whose grace period has expired.
    Should run daily (e.g., via cron every hour or every 6 hours).
    """
    async with AsyncSessionLocal() as db:
        from app.models.database import User as DbUser

        result = await db.execute(
            select(DbUser).where(
                DbUser.subscription_tier != "free",
                DbUser.grace_period_end != None,
                DbUser.grace_period_end <= datetime.utcnow()
            )
        )
        users = result.scalars().all()

        for user in users:
            old_tier = user.subscription_tier
            user.subscription_tier = "free"
            user.subscription_expires_at = None
            user.grace_period_end = None

            send_subscription_email(
                user.email,
                user.name or "",
                old_tier,
                "expired"
            )
            logger.info(f"Downgraded {user.email} from {old_tier} to free (grace period expired)")

        if users:
            await db.commit()
            logger.info(f"Grace period enforcement: {len(users)} user(s) downgraded")
        else:
            logger.info("Grace period enforcement: no expired grace periods")


async def send_renewal_reminders():
    """
    Send renewal warning emails to users whose subscription
    renews in the next 3 days. Should run daily.
    """
    async with AsyncSessionLocal() as db:
        from app.models.database import User as DbUser

        three_days = datetime.utcnow() + timedelta(days=3)
        today = datetime.utcnow()

        result = await db.execute(
            select(DbUser).where(
                DbUser.subscription_tier != "free",
                DbUser.subscription_expires_at != None,
                DbUser.subscription_expires_at <= three_days,
                DbUser.subscription_expires_at > today
            )
        )
        users = result.scalars().all()

        plan_prices = {
            "standard": "₦3,000",
            "pro": "₦8,000",
            "family": "₦12,000",
        }

        for user in users:
            renewal_date = user.subscription_expires_at.strftime("%B %d, %Y")
            amount = plan_prices.get(user.subscription_tier, "₦0")

            send_renewal_warning_email(
                user.email,
                user.name or "",
                user.subscription_tier,
                renewal_date,
                amount
            )
            logger.info(f"Renewal reminder sent to {user.email} (renews {renewal_date})")

        logger.info(f"Renewal reminders: {len(users)} email(s) sent")


async def cleanup_expired_sessions():
    """
    Clean up expired refresh tokens from the database.
    Should run daily.
    """
    async with AsyncSessionLocal() as db:
        from sqlalchemy import text

        result = await db.execute(text("""
            DELETE FROM refresh_tokens
            WHERE expires_at < NOW()
        """))
        await db.commit()
        logger.info("Cleaned up expired refresh tokens")


# ═══════════════════════════════════════════════════════════
# V2 — Yearly Stats (Wrapped-style analytics)
# ═══════════════════════════════════════════════════════════

async def compute_yearly_stats():
    """
    Compute yearly viewing statistics for all users.
    Generates Wrapped-style analytics: top genres, favorite actors,
    total watch time, binge sessions, etc.
    Should run weekly or monthly.
    """
    async with AsyncSessionLocal() as db:
        from app.models.database import User as DbUser, YearlyStats
        from sqlalchemy import text
        import json

        current_year = datetime.utcnow().year

        # Get all premium users
        result = await db.execute(
            select(DbUser).where(DbUser.subscription_tier != "free")
        )
        users = result.scalars().all()

        for user in users:
            try:
                # Aggregate watch history for the current year
                watch_data = await db.execute(text("""
                    SELECT
                        COUNT(*) as total_movies,
                        COALESCE(SUM(duration), 0) as total_watch_time,
                        MAX(duration) as longest_movie
                    FROM watch_history
                    WHERE user_id = :uid
                      AND EXTRACT(YEAR FROM watched_at) = :year
                """), {"uid": str(user.id), "year": current_year})
                row = watch_data.fetchone()

                if not row or row.total_movies == 0:
                    continue

                # Get top genres
                genre_data = await db.execute(text("""
                    SELECT g.name, COUNT(*) as cnt
                    FROM watch_history wh
                    JOIN movie_genres mg ON wh.movie_id = mg.movie_id
                    JOIN genres g ON mg.genre_id = g.id
                    WHERE wh.user_id = :uid
                      AND EXTRACT(YEAR FROM wh.watched_at) = :year
                    GROUP BY g.name
                    ORDER BY cnt DESC
                    LIMIT 5
                """), {"uid": str(user.id), "year": current_year})
                top_genres = [{"name": r.name, "count": r.cnt} for r in genre_data.fetchall()]

                stats_data = {
                    "year": current_year,
                    "total_movies_watched": row.total_movies,
                    "total_watch_time_minutes": row.total_watch_time,
                    "top_genres": top_genres,
                    "longest_session_minutes": row.longest_movie or 0,
                }

                # Upsert yearly stats
                existing = await db.execute(
                    select(YearlyStats).where(
                        YearlyStats.user_id == user.id,
                        YearlyStats.year == current_year
                    )
                )
                stats = existing.scalars().first()

                if stats:
                    stats.data = stats_data
                else:
                    new_stats = YearlyStats(
                        user_id=user.id,
                        year=current_year,
                        data=stats_data
                    )
                    db.add(new_stats)

                logger.info(f"Stats computed for {user.email}: {row.total_movies} movies, {row.total_watch_time}min")

            except Exception as e:
                try:
                    import sentry_sdk
                    sentry_sdk.capture_exception(e)
                except Exception:
                    pass
                logger.warning(f"Stats computation failed for {user.email}: {e}")

        await db.commit()
        logger.info(f"Yearly stats: computed for {len(users)} user(s)")


async def cleanup_expired_invites():
    """
    Clean up expired family invites and watch party rooms.
    Should run daily.
    """
    async with AsyncSessionLocal() as db:
        from sqlalchemy import text

        # Expire old family invites
        await db.execute(text("""
            UPDATE family_invites
            SET status = 'expired'
            WHERE status = 'pending' AND expires_at < NOW()
        """))

        # End stale watch party rooms (older than 12 hours)
        await db.execute(text("""
            UPDATE watch_party_rooms
            SET status = 'ended'
            WHERE status = 'active'
              AND created_at < NOW() - INTERVAL '12 hours'
        """))

        await db.commit()
        logger.info("Cleaned up expired invites and stale watch party rooms")


async def run_all_tasks():
    """Run all scheduled tasks."""
    logger.info(f"{'='*50}")
    logger.info(f"Running scheduled tasks at {datetime.utcnow().isoformat()}")
    logger.info(f"{'='*50}")

    await enforce_grace_periods()
    await send_renewal_reminders()

    try:
        await cleanup_expired_sessions()
    except Exception as e:
        try:
            import sentry_sdk
            sentry_sdk.capture_exception(e)
        except Exception:
            pass
        logger.warning(f"Session cleanup skipped: {e}")

    try:
        await cleanup_expired_invites()
    except Exception as e:
        try:
            import sentry_sdk
            sentry_sdk.capture_exception(e)
        except Exception:
            pass
        logger.warning(f"Invite cleanup skipped: {e}")

    try:
        await compute_yearly_stats()
    except Exception as e:
        try:
            import sentry_sdk
            sentry_sdk.capture_exception(e)
        except Exception:
            pass
        logger.warning(f"Yearly stats skipped: {e}")

    logger.info(f"{'='*50}")


if __name__ == "__main__":
    asyncio.run(run_all_tasks())

