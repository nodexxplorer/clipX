"""
Email Service
Handles sending verification emails, password reset emails, etc.
Uses SMTP with environment variables for configuration.
"""

import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import timedelta
from app.core.auth import create_access_token

logger = logging.getLogger("clipx")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)
FROM_NAME = os.getenv("FROM_NAME", "clipX")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send an email using SMTP. Returns True on success."""
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning(f"SMTP not configured. Email to {to_email} not sent. Subject: {subject}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())

        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        try:
            import sentry_sdk
            sentry_sdk.capture_exception(e)
        except Exception:
            pass
        logger.exception(f"Email failed to {to_email}")
        return False


def send_verification_email(user_id: str, user_email: str, user_name: str = "") -> str:
    """
    Send an email verification link.
    Returns the verification token (for dev/testing purposes).
    """
    token = create_access_token(
        data={"sub": user_id, "type": "email_verify", "email": user_email},
        expires_delta=timedelta(hours=24)
    )
    verify_url = f"{FRONTEND_URL}/auth/verify-email?token={token}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#050607;font-family:'Inter',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#0f1115;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0891b2,#3b82f6);padding:32px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;letter-spacing:-0.5px;">clip<span style="font-size:32px;">X</span></h1>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#fff;font-size:22px;margin:0 0 12px;">Verify Your Email</h2>
          <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 28px;">
            Hi {user_name or 'there'}! 👋<br>
            Click the button below to verify your email address and activate your clipX account.
          </p>
          <a href="{verify_url}" 
             style="display:inline-block;background:linear-gradient(135deg,#0891b2,#3b82f6);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:15px;">
            Verify Email
          </a>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:28px 0 0;">
            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="color:#4b5563;font-size:12px;margin:0;">© {2026} clipX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """

    _send_email(user_email, "Verify your clipX email", html)
    return token


def send_password_reset_email(user_id: str, user_email: str, user_name: str = "") -> str:
    """
    Send a password reset email.
    Returns the reset token (for dev/testing purposes).
    """
    token = create_access_token(
        data={"sub": user_id, "type": "reset", "email": user_email},
        expires_delta=timedelta(hours=1)
    )
    reset_url = f"{FRONTEND_URL}/auth/reset-password?token={token}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#050607;font-family:'Inter',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#0f1115;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0891b2,#3b82f6);padding:32px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;letter-spacing:-0.5px;">clip<span style="font-size:32px;">X</span></h1>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#fff;font-size:22px;margin:0 0 12px;">Reset Your Password</h2>
          <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 28px;">
            Hi {user_name or 'there'},<br>
            We received a request to reset your password. Click the button below to set a new one.
          </p>
          <a href="{reset_url}" 
             style="display:inline-block;background:linear-gradient(135deg,#0891b2,#3b82f6);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:15px;">
            Reset Password
          </a>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:28px 0 0;">
            This link expires in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="color:#4b5563;font-size:12px;margin:0;">© {2026} clipX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """

    _send_email(user_email, "Reset your clipX password", html)
    return token


def send_subscription_email(user_email: str, user_name: str, plan: str, action: str = "activated") -> bool:
    """Send subscription confirmation/cancellation email."""
    action_text = {
        "activated": "Your subscription has been activated!",
        "upgraded": "Your subscription has been upgraded!",
        "cancelled": "Your subscription has been cancelled.",
        "renewed": "Your subscription has been renewed.",
        "expired": "Your subscription has expired.",
    }.get(action, f"Your subscription has been {action}.")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#050607;font-family:'Inter',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#0f1115;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#8b5cf6,#ec4899);padding:32px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;">clip<span style="font-size:32px;">X</span></h1>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#fff;font-size:22px;margin:0 0 12px;">{action_text}</h2>
          <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 20px;">
            Hi {user_name or 'there'},<br>
            Your <strong style="color:#fff;">{plan.capitalize()}</strong> plan is now {action}.
          </p>
          <a href="{FRONTEND_URL}/subscription" 
             style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:15px;">
            Manage Subscription
          </a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="color:#4b5563;font-size:12px;margin:0;">© {2026} clipX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """

    return _send_email(user_email, f"clipX — {action_text}", html)


def send_renewal_warning_email(user_email: str, user_name: str, plan: str, renewal_date: str, amount: str) -> bool:
    """Send auto-renewal warning 3 days before charge."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#050607;font-family:'Inter',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#0f1115;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:32px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;">clip<span style="font-size:32px;">X</span></h1>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#fff;font-size:22px;margin:0 0 12px;">Renewal Reminder ⏰</h2>
          <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 20px;">
            Hi {user_name or 'there'},<br>
            Your <strong style="color:#fff;">{plan.capitalize()}</strong> subscription will auto-renew on
            <strong style="color:#f59e0b;">{renewal_date}</strong> for <strong style="color:#fff;">{amount}</strong>.
          </p>
          <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 28px;">
            If you'd like to cancel or change your plan, please do so before the renewal date to avoid being charged.
          </p>
          <a href="{FRONTEND_URL}/subscription"
             style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:15px;">
            Manage Subscription
          </a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="color:#4b5563;font-size:12px;margin:0;">© {2026} clipX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """
    return _send_email(user_email, f"clipX — Your {plan} plan renews on {renewal_date}", html)


def send_grace_period_email(user_email: str, user_name: str, plan: str, grace_end_date: str) -> bool:
    """Send grace period notice on failed payment (5-day window before downgrade)."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#050607;font-family:'Inter',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#0f1115;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:32px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;">clip<span style="font-size:32px;">X</span></h1>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#fff;font-size:22px;margin:0 0 12px;">Payment Failed — Grace Period Active ⚠️</h2>
          <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 20px;">
            Hi {user_name or 'there'},<br>
            We couldn't process your payment for the <strong style="color:#fff;">{plan.capitalize()}</strong> plan.
            Don't worry — you have until <strong style="color:#ef4444;">{grace_end_date}</strong> to update your payment method before your account is downgraded.
          </p>
          <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 28px;">
            Your current features will remain active during this grace period. Please update your payment details to avoid interruption.
          </p>
          <a href="{FRONTEND_URL}/subscription"
             style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:15px;">
            Update Payment
          </a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="color:#4b5563;font-size:12px;margin:0;">© {2026} clipX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """
    return _send_email(user_email, "clipX — Action Required: Payment Failed", html)


def send_retention_offer_email(user_email: str, user_name: str, plan: str) -> bool:
    """Send retention offer (50% off) when user tries to cancel."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#050607;font-family:'Inter',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#0f1115;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#8b5cf6,#06b6d4);padding:32px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;">clip<span style="font-size:32px;">X</span></h1>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#fff;font-size:22px;margin:0 0 12px;">We'd hate to see you go! 💔</h2>
          <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 20px;">
            Hi {user_name or 'there'},<br>
            We noticed you're thinking about cancelling your <strong style="color:#fff;">{plan.capitalize()}</strong> plan.
          </p>
          <div style="background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(6,182,212,0.15));border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:24px;margin:0 0 28px;text-align:center;">
            <p style="color:#8b5cf6;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Special Offer</p>
            <p style="color:#fff;font-size:28px;font-weight:900;margin:0 0 4px;">50% OFF</p>
            <p style="color:#9ca3af;font-size:14px;margin:0;">your next month if you stay!</p>
          </div>
          <a href="{FRONTEND_URL}/subscription?offer=retention"
             style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#06b6d4);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:15px;">
            Claim 50% Off
          </a>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:28px 0 0;">
            If you still want to cancel, you can do so from your subscription page. No hard feelings! ❤️
          </p>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="color:#4b5563;font-size:12px;margin:0;">© {2026} clipX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """
    return _send_email(user_email, "clipX — Stay for 50% off! 💜", html)


# ═══════════════════════════════════════════════════════════
# V2 Email Templates
# ═══════════════════════════════════════════════════════════

def send_watch_party_invite_email(to_email: str, host_name: str, room_code: str, movie_title: str = "a movie") -> bool:
    """Send a watch party invitation email."""
    join_url = f"{FRONTEND_URL}/watch-party/{room_code}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#050607;font-family:'Inter',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#0f1115;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#10b981,#06b6d4);padding:32px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;letter-spacing:-0.5px;">clip<span style="font-size:32px;">X</span></h1>
          <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Watch Party</p>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#fff;font-size:22px;margin:0 0 12px;">You're Invited! 🎬🍿</h2>
          <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 28px;">
            <strong style="color:#fff;">{host_name}</strong> has invited you to watch <strong style="color:#10b981;">{movie_title}</strong> together on clipX!
          </p>
          <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:20px;margin:0 0 28px;text-align:center;">
            <p style="color:#6b7280;font-size:12px;margin:0 0 4px;">Room Code</p>
            <p style="color:#fff;font-size:28px;font-weight:900;letter-spacing:4px;margin:0;">{room_code}</p>
          </div>
          <a href="{join_url}"
             style="display:inline-block;background:linear-gradient(135deg,#10b981,#06b6d4);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:15px;">
            Join Watch Party
          </a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="color:#4b5563;font-size:12px;margin:0;">© {2026} clipX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """
    return _send_email(to_email, f"clipX — {host_name} invited you to a Watch Party! 🍿", html)


def send_family_invite_email(to_email: str, owner_name: str, invite_token: str) -> bool:
    """Send a family plan invitation email with accept link."""
    accept_url = f"{FRONTEND_URL}/family/accept?token={invite_token}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#050607;font-family:'Inter',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#0f1115;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;letter-spacing:-0.5px;">clip<span style="font-size:32px;">X</span></h1>
          <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Family Plan</p>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#fff;font-size:22px;margin:0 0 12px;">You're Invited to a Family Plan! 👨‍👩‍👧‍👦</h2>
          <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 28px;">
            <strong style="color:#fff;">{owner_name}</strong> has invited you to join their clipX Family Plan.
            You'll get full premium access — 4K streaming, unlimited downloads, and your own personalized profile!
          </p>
          <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:20px;margin:0 0 28px;">
            <p style="color:#10b981;font-size:14px;font-weight:600;margin:0 0 8px;">✨ What you get:</p>
            <ul style="color:#9ca3af;font-size:14px;line-height:1.8;margin:0;padding-left:20px;">
              <li>4K Ultra HD streaming</li>
              <li>Your own profile & watchlist</li>
              <li>Unlimited downloads</li>
              <li>Zero ads</li>
              <li>AI-powered recommendations</li>
            </ul>
          </div>
          <a href="{accept_url}"
             style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:15px;">
            Accept Invitation
          </a>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:28px 0 0;">
            This invitation expires in 7 days. If you don't have a clipX account, you'll be asked to create one first.
          </p>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="color:#4b5563;font-size:12px;margin:0;">© {2026} clipX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """
    return _send_email(to_email, f"clipX — {owner_name} invited you to their Family Plan! 👨‍👩‍👧‍👦", html)


def send_welcome_email(user_email: str, user_name: str = "") -> bool:
    """Send a welcome/onboarding email after registration."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#050607;font-family:'Inter',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#0f1115;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0891b2,#8b5cf6);padding:40px;text-align:center;">
          <h1 style="color:#fff;font-size:36px;margin:0;font-weight:900;letter-spacing:-0.5px;">clip<span style="font-size:42px;">X</span></h1>
          <p style="color:rgba(255,255,255,0.9);font-size:16px;margin:12px 0 0;">Welcome aboard! 🎉</p>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#fff;font-size:22px;margin:0 0 12px;">Hey {user_name or 'there'}! 👋</h2>
          <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 28px;">
            Your clipX account is ready. Here's what you can do right away:
          </p>

          <div style="margin:0 0 16px;">
            <div style="display:flex;align-items:center;margin:0 0 16px;padding:16px;background:rgba(139,92,246,0.1);border-radius:12px;border:1px solid rgba(139,92,246,0.15);">
              <span style="font-size:24px;margin-right:12px;">🎬</span>
              <div>
                <p style="color:#fff;font-size:14px;font-weight:600;margin:0;">Browse 50,000+ titles</p>
                <p style="color:#6b7280;font-size:13px;margin:2px 0 0;">Movies, series, anime — all in one place</p>
              </div>
            </div>
            <div style="display:flex;align-items:center;margin:0 0 16px;padding:16px;background:rgba(8,145,178,0.1);border-radius:12px;border:1px solid rgba(8,145,178,0.15);">
              <span style="font-size:24px;margin-right:12px;">🤖</span>
              <div>
                <p style="color:#fff;font-size:14px;font-weight:600;margin:0;">AI-powered recommendations</p>
                <p style="color:#6b7280;font-size:13px;margin:2px 0 0;">Tell us your mood and we'll find the perfect watch</p>
              </div>
            </div>
            <div style="display:flex;align-items:center;padding:16px;background:rgba(16,185,129,0.1);border-radius:12px;border:1px solid rgba(16,185,129,0.15);">
              <span style="font-size:24px;margin-right:12px;">🍿</span>
              <div>
                <p style="color:#fff;font-size:14px;font-weight:600;margin:0;">Watch Parties</p>
                <p style="color:#6b7280;font-size:13px;margin:2px 0 0;">Stream together with friends in real-time</p>
              </div>
            </div>
          </div>

          <a href="{FRONTEND_URL}/dashboard"
             style="display:inline-block;width:100%;box-sizing:border-box;text-align:center;background:linear-gradient(135deg,#0891b2,#8b5cf6);color:#fff;text-decoration:none;padding:14px;border-radius:12px;font-weight:700;font-size:15px;margin-top:20px;">
            Start Exploring →
          </a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="color:#4b5563;font-size:12px;margin:0;">© {2026} clipX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """
    return _send_email(user_email, "Welcome to clipX! 🎬🍿", html)


def send_weekly_digest_email(user_email: str, user_name: str, new_releases: list, recommendations: list) -> bool:
    """Send a weekly digest email with new releases and personalized picks."""
    releases_html = ""
    for r in new_releases[:5]:
        releases_html += f"""
        <div style="display:inline-block;width:90px;margin:0 8px 8px 0;vertical-align:top;">
          <img src="{r.get('poster', '')}" width="90" style="border-radius:8px;display:block;" alt="{r.get('title', '')}">
          <p style="color:#fff;font-size:11px;margin:4px 0 0;line-height:1.3;">{r.get('title', '')}</p>
        </div>"""

    recs_html = ""
    for r in recommendations[:5]:
        recs_html += f"""
        <div style="display:inline-block;width:90px;margin:0 8px 8px 0;vertical-align:top;">
          <img src="{r.get('poster', '')}" width="90" style="border-radius:8px;display:block;" alt="{r.get('title', '')}">
          <p style="color:#fff;font-size:11px;margin:4px 0 0;line-height:1.3;">{r.get('title', '')}</p>
        </div>"""

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#050607;font-family:'Inter',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#0f1115;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0891b2,#3b82f6);padding:32px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;">clip<span style="font-size:32px;">X</span></h1>
          <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Your Weekly Digest 📬</p>
        </div>
        <div style="padding:32px;">
          <p style="color:#9ca3af;font-size:15px;margin:0 0 24px;">Hi {user_name or 'there'}, here's what's new this week!</p>

          {"<h3 style='color:#fff;font-size:16px;margin:0 0 12px;'>🆕 New Releases</h3><div style='margin:0 0 24px;'>" + releases_html + "</div>" if releases_html else ""}

          {"<h3 style='color:#fff;font-size:16px;margin:0 0 12px;'>🎯 Picked For You</h3><div style='margin:0 0 24px;'>" + recs_html + "</div>" if recs_html else ""}

          <a href="{FRONTEND_URL}/dashboard"
             style="display:inline-block;background:linear-gradient(135deg,#0891b2,#3b82f6);color:#fff;text-decoration:none;padding:12px 32px;border-radius:12px;font-weight:700;font-size:14px;">
            Explore More →
          </a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="color:#4b5563;font-size:12px;margin:0;">© {2026} clipX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """
    return _send_email(user_email, "clipX — Your Weekly Picks 🎬", html)

