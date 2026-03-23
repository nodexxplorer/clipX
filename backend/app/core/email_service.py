"""
Email Service
Handles sending verification emails, password reset emails, etc.
Uses SMTP with environment variables for configuration.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import timedelta
from app.core.auth import create_access_token

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
        print(f"⚠️  SMTP not configured. Email to {to_email} not sent.")
        print(f"   Subject: {subject}")
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

        print(f"✅ Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"❌ Email failed to {to_email}: {e}")
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

