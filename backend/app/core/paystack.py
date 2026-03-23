"""
Paystack Integration Service
Handles subscription creation, verification, webhooks
Documentation: https://paystack.com/docs/api/
"""

import os
import hmac
import hashlib
import httpx
from typing import Optional, Dict, Any

PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "")
PAYSTACK_PUBLIC_KEY = os.getenv("PAYSTACK_PUBLIC_KEY", "")
PAYSTACK_BASE_URL = "https://api.paystack.co"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Plan codes — create these in Paystack dashboard
PLAN_CODES = {
    "standard_monthly": os.getenv("PAYSTACK_PLAN_STANDARD_MONTHLY", ""),
    "standard_yearly": os.getenv("PAYSTACK_PLAN_STANDARD_YEARLY", ""),
    "pro_monthly": os.getenv("PAYSTACK_PLAN_PRO_MONTHLY", ""),
    "pro_yearly": os.getenv("PAYSTACK_PLAN_PRO_YEARLY", ""),
}

# Plan amounts in kobo (1 NGN = 100 kobo)
PLAN_AMOUNTS = {
    "standard_monthly": 300000,   # ₦3,000
    "standard_yearly": 2880000,   # ₦28,800
    "pro_monthly": 800000,        # ₦8,000
    "pro_yearly": 7680000,        # ₦76,800
}


def _headers():
    return {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }


async def initialize_transaction(
    email: str,
    amount: int,
    plan: str = "",
    reference: str = "",
    metadata: Optional[Dict] = None,
    callback_url: str = "",
) -> Dict[str, Any]:
    """
    Initialize a Paystack transaction.
    Amount is in kobo (₦1 = 100 kobo).
    Returns: { authorization_url, access_code, reference }
    """
    if not PAYSTACK_SECRET_KEY:
        return {"error": "Paystack not configured", "status": False}

    payload = {
        "email": email,
        "amount": amount,
        "currency": "NGN",
        "callback_url": callback_url or f"{FRONTEND_URL}/subscription?verify=true",
        "metadata": metadata or {},
    }

    if reference:
        payload["reference"] = reference
    if plan and PLAN_CODES.get(plan):
        payload["plan"] = PLAN_CODES[plan]

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYSTACK_BASE_URL}/transaction/initialize",
            json=payload,
            headers=_headers(),
            timeout=15,
        )
        data = resp.json()
        if data.get("status"):
            return {
                "status": True,
                "authorization_url": data["data"]["authorization_url"],
                "access_code": data["data"]["access_code"],
                "reference": data["data"]["reference"],
            }
        return {"status": False, "error": data.get("message", "Failed to initialize")}


async def verify_transaction(reference: str) -> Dict[str, Any]:
    """
    Verify a Paystack transaction by reference.
    Returns transaction details if successful.
    """
    if not PAYSTACK_SECRET_KEY:
        return {"status": False, "error": "Paystack not configured"}

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}",
            headers=_headers(),
            timeout=15,
        )
        data = resp.json()
        if data.get("status") and data["data"]["status"] == "success":
            return {
                "status": True,
                "amount": data["data"]["amount"],
                "currency": data["data"]["currency"],
                "reference": data["data"]["reference"],
                "customer_email": data["data"]["customer"]["email"],
                "customer_code": data["data"]["customer"]["customer_code"],
                "paid_at": data["data"]["paid_at"],
                "channel": data["data"]["channel"],
                "metadata": data["data"].get("metadata", {}),
            }
        return {
            "status": False,
            "error": data.get("message", "Verification failed"),
            "gateway_status": data["data"]["status"] if "data" in data else "unknown",
        }


async def create_subscription(
    customer_code: str,
    plan_code: str,
) -> Dict[str, Any]:
    """Create a Paystack subscription for a customer."""
    if not PAYSTACK_SECRET_KEY:
        return {"status": False, "error": "Paystack not configured"}

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYSTACK_BASE_URL}/subscription",
            json={"customer": customer_code, "plan": plan_code},
            headers=_headers(),
            timeout=15,
        )
        data = resp.json()
        if data.get("status"):
            return {
                "status": True,
                "subscription_code": data["data"]["subscription_code"],
                "email_token": data["data"]["email_token"],
            }
        return {"status": False, "error": data.get("message", "Subscription failed")}


async def cancel_subscription(subscription_code: str, email_token: str) -> Dict[str, Any]:
    """Cancel a Paystack subscription."""
    if not PAYSTACK_SECRET_KEY:
        return {"status": False, "error": "Paystack not configured"}

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYSTACK_BASE_URL}/subscription/disable",
            json={"code": subscription_code, "token": email_token},
            headers=_headers(),
            timeout=15,
        )
        data = resp.json()
        return {"status": data.get("status", False), "message": data.get("message", "")}


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    """Verify Paystack webhook signature using HMAC SHA512."""
    if not PAYSTACK_SECRET_KEY:
        return False
    expected = hmac.new(
        PAYSTACK_SECRET_KEY.encode("utf-8"),
        body,
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
