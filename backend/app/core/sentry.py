"""
Sentry Error Logging Integration
Captures unhandled exceptions, performance metrics, and custom events.

Setup:
1. pip install sentry-sdk[fastapi]
2. Set SENTRY_DSN in your .env
3. Import setup_sentry() in main.py
"""

import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import logging


def setup_sentry():
    """Initialize Sentry SDK for error tracking and performance monitoring."""
    dsn = os.getenv("SENTRY_DSN", "")

    if not dsn:
        print("⚠️  SENTRY_DSN not set — error logging disabled")
        return False

    environment = os.getenv("ENVIRONMENT", "development")
    release = os.getenv("APP_VERSION", "clipx@1.0.0")

    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        release=release,

        # Performance monitoring: capture 20% of transactions in prod, 100% in dev
        traces_sample_rate=1.0 if environment == "development" else 0.2,

        # Profile 10% of sampled transactions (for performance profiling)
        profiles_sample_rate=0.1,

        # Send user info with events (email, id)
        send_default_pii=True,

        integrations=[
            FastApiIntegration(
                transaction_style="endpoint",
            ),
            SqlalchemyIntegration(),
            LoggingIntegration(
                level=logging.WARNING,       # Capture WARNING+ as breadcrumbs
                event_level=logging.ERROR,   # Send ERROR+ as Sentry events
            ),
        ],

        # Filter out noisy/expected errors
        before_send=_filter_events,

        # Tag all events with service info
        server_name=os.getenv("SERVER_NAME", "clipx-api"),
    )

    print(f"✅ Sentry initialized ({environment})")
    return True


def _filter_events(event, hint):
    """Filter out expected/noisy errors before sending to Sentry."""
    if "exc_info" in hint:
        exc_type, exc_value, _ = hint["exc_info"]

        # Don't report 404s or auth failures to Sentry
        exc_name = exc_type.__name__ if exc_type else ""
        if exc_name in ("HTTPException",):
            from fastapi import HTTPException
            if isinstance(exc_value, HTTPException) and exc_value.status_code in (401, 403, 404, 422):
                return None

        # Skip JWT decode errors (expected behavior for expired tokens)
        if "token" in str(exc_value).lower() and "expired" in str(exc_value).lower():
            return None

    return event


def capture_message(message: str, level: str = "info", extra: dict = None):
    """Send a custom message/event to Sentry."""
    with sentry_sdk.push_scope() as scope:
        if extra:
            for key, value in extra.items():
                scope.set_extra(key, value)
        sentry_sdk.capture_message(message, level=level)


def set_user_context(user_id: str, email: str = None, username: str = None):
    """Set user context for Sentry events (call on authentication)."""
    sentry_sdk.set_user({
        "id": user_id,
        "email": email,
        "username": username,
    })


def add_breadcrumb(message: str, category: str = "custom", data: dict = None):
    """Add a breadcrumb (trail of events leading up to an error)."""
    sentry_sdk.add_breadcrumb(
        message=message,
        category=category,
        data=data or {},
    )
