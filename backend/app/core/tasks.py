
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.core.email_service import (
    send_renewal_warning_email,
    send_subscription_email,
    send_grace_period_email,
)


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
            print(f"  ⬇️  Downgraded {user.email} from {old_tier} to free (grace period expired)")

        if users:
            await db.commit()
            print(f"✅ Grace period enforcement: {len(users)} user(s) downgraded")
        else:
            print("✅ Grace period enforcement: no expired grace periods")


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
            print(f"  📧 Renewal reminder sent to {user.email} (renews {renewal_date})")

        print(f"✅ Renewal reminders: {len(users)} email(s) sent")


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
        print(f"✅ Cleaned up expired refresh tokens")


async def run_all_tasks():
    """Run all scheduled tasks."""
    print(f"\n{'='*50}")
    print(f"🕐 Running scheduled tasks at {datetime.utcnow().isoformat()}")
    print(f"{'='*50}")

    await enforce_grace_periods()
    await send_renewal_reminders()

    try:
        await cleanup_expired_sessions()
    except Exception as e:
        print(f"⚠️  Session cleanup skipped: {e}")

    print(f"{'='*50}\n")


if __name__ == "__main__":
    asyncio.run(run_all_tasks())
