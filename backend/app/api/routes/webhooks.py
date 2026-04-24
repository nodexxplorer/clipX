"""
Paystack Webhook Route
Handles subscription events from Paystack
- Grace period: 5 days on failed payment before downgrade
- Auto-renewal warning: Handled via scheduled task (see tasks.py)
"""

from fastapi import APIRouter, Request, Response
from app.core.paystack import verify_webhook_signature
from app.core.database import AsyncSessionLocal
from app.core.email_service import send_subscription_email, send_grace_period_email, send_renewal_warning_email
from sqlalchemy.future import select
from datetime import datetime, timedelta
import json
import logging

logger = logging.getLogger("clipx")

router = APIRouter()

GRACE_PERIOD_DAYS = 5


@router.post("/webhooks/paystack")
async def paystack_webhook(request: Request):
    """Handle Paystack webhook events."""
    body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")

    if not verify_webhook_signature(body, signature):
        return Response(status_code=400, content="Invalid signature")

    try:
        event = json.loads(body)
    except json.JSONDecodeError:
        return Response(status_code=400, content="Invalid JSON")

    event_type = event.get("event", "")
    data = event.get("data", {})

    logger.info(f"Paystack webhook: {event_type}")

    async with AsyncSessionLocal() as db:
        from app.models.database import User as DbUser

        if event_type == "charge.success":
            # Payment succeeded — activate/renew subscription
            metadata = data.get("metadata", {})
            user_id = metadata.get("user_id")
            plan = metadata.get("plan", "standard")
            billing = metadata.get("billing", "monthly")

            if user_id:
                result = await db.execute(select(DbUser).where(DbUser.id == user_id))
                user = result.scalars().first()
                if user:
                    user.subscription_tier = plan
                    expires_days = 365 if billing == "yearly" else 30
                    user.subscription_expires_at = datetime.utcnow() + timedelta(days=expires_days)
                    user.paystack_customer_code = data.get("customer", {}).get("customer_code")
                    # Clear grace period if payment succeeds
                    if hasattr(user, 'grace_period_end'):
                        user.grace_period_end = None
                    await db.commit()
                    logger.info(f"User {user.email} upgraded to {plan}")

                    # Send confirmation email
                    send_subscription_email(user.email, user.name or "", plan, "activated")

                    # Record payment
                    from sqlalchemy import text
                    await db.execute(text("""
                        INSERT INTO payment_history (user_id, paystack_reference, amount, currency, status, plan, payment_method, paid_at)
                        VALUES (:uid, :ref, :amt, :cur, 'paid', :plan, :method, :paid)
                    """), {
                        "uid": user_id,
                        "ref": data.get("reference"),
                        "amt": data.get("amount", 0),
                        "cur": data.get("currency", "NGN"),
                        "plan": plan,
                        "method": data.get("channel", "card"),
                        "paid": data.get("paid_at"),
                    })
                    await db.commit()

        elif event_type == "subscription.create":
            customer_code = data.get("customer", {}).get("customer_code")
            if customer_code:
                result = await db.execute(
                    select(DbUser).where(DbUser.paystack_customer_code == customer_code)
                )
                user = result.scalars().first()
                if user:
                    logger.info(f"Subscription created for {user.email}")

        elif event_type == "subscription.disable":
            customer_code = data.get("customer", {}).get("customer_code")
            if customer_code:
                result = await db.execute(
                    select(DbUser).where(DbUser.paystack_customer_code == customer_code)
                )
                user = result.scalars().first()
                if user:
                    user.subscription_tier = "free"
                    user.subscription_expires_at = None
                    if hasattr(user, 'grace_period_end'):
                        user.grace_period_end = None
                    await db.commit()
                    logger.info(f"Subscription cancelled for {user.email}")
                    send_subscription_email(user.email, user.name or "", "free", "cancelled")

        elif event_type == "invoice.payment_failed":
            # Payment failed — start grace period (5 days before downgrade)
            customer_code = data.get("customer", {}).get("customer_code")
            if customer_code:
                result = await db.execute(
                    select(DbUser).where(DbUser.paystack_customer_code == customer_code)
                )
                user = result.scalars().first()
                if user:
                    grace_end = datetime.utcnow() + timedelta(days=GRACE_PERIOD_DAYS)
                    grace_end_str = grace_end.strftime("%B %d, %Y")

                    # Set grace period end on user (if column exists)
                    if hasattr(user, 'grace_period_end'):
                        user.grace_period_end = grace_end

                    logger.warning(f"Payment failed for {user.email} — grace period until {grace_end_str}")

                    # Send grace period email
                    send_grace_period_email(
                        user.email,
                        user.name or "",
                        user.subscription_tier or "standard",
                        grace_end_str
                    )

                    # Record failed payment
                    from sqlalchemy import text
                    await db.execute(text("""
                        INSERT INTO payment_history (user_id, paystack_reference, amount, currency, status, plan, paid_at)
                        VALUES (:uid, :ref, :amt, :cur, 'failed', :plan, NOW())
                    """), {
                        "uid": str(user.id),
                        "ref": data.get("reference", ""),
                        "amt": data.get("amount", 0),
                        "cur": "NGN",
                        "plan": user.subscription_tier,
                    })
                    await db.commit()

        elif event_type == "invoice.update":
            # Invoice upcoming — send renewal warning
            customer = data.get("customer", {})
            customer_code = customer.get("customer_code")
            if customer_code:
                result = await db.execute(
                    select(DbUser).where(DbUser.paystack_customer_code == customer_code)
                )
                user = result.scalars().first()
                if user and user.subscription_tier != "free":
                    amount_kobo = data.get("amount", 0)
                    amount = f"₦{amount_kobo / 100:,.0f}"
                    due_date = data.get("due_date", "")
                    if due_date:
                        try:
                            dt = datetime.fromisoformat(due_date.replace("Z", "+00:00"))
                            due_date_str = dt.strftime("%B %d, %Y")
                        except Exception:
                            due_date_str = due_date
                    else:
                        next_renewal = datetime.utcnow() + timedelta(days=3)
                        due_date_str = next_renewal.strftime("%B %d, %Y")

                    send_renewal_warning_email(
                        user.email,
                        user.name or "",
                        user.subscription_tier,
                        due_date_str,
                        amount
                    )
                    logger.info(f"Renewal warning sent to {user.email}")

    return Response(status_code=200, content="OK")
