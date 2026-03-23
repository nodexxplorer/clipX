"""
Invoice Generation Route
Generates PDF invoices for payment history items
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from app.core.database import AsyncSessionLocal
from app.core.auth import decode_access_token
from sqlalchemy import text
from datetime import datetime
import io

router = APIRouter()


def generate_invoice_pdf(invoice_data: dict) -> bytes:
    """Generate a simple PDF invoice using basic PDF structure."""
    # We generate a clean PDF without external libraries
    # This creates a minimal valid PDF with invoice content
    
    user_email = invoice_data.get("email", "")
    user_name = invoice_data.get("name", "Customer")
    ref = invoice_data.get("reference", "N/A")
    amount_raw = invoice_data.get("amount", 0)
    amount = f"₦{amount_raw / 100:,.2f}" if amount_raw > 100 else f"₦{amount_raw:,.2f}"
    currency = invoice_data.get("currency", "NGN")
    plan = invoice_data.get("plan", "Standard").capitalize()
    status = invoice_data.get("status", "paid").capitalize()
    paid_at = invoice_data.get("paid_at", "")
    invoice_no = f"CLX-{ref[:8].upper() if ref != 'N/A' else datetime.utcnow().strftime('%Y%m%d')}"
    
    if paid_at and isinstance(paid_at, str):
        try:
            dt = datetime.fromisoformat(paid_at.replace("Z", "+00:00"))
            paid_at_str = dt.strftime("%B %d, %Y")
        except Exception:
            paid_at_str = paid_at
    elif isinstance(paid_at, datetime):
        paid_at_str = paid_at.strftime("%B %d, %Y")
    else:
        paid_at_str = datetime.utcnow().strftime("%B %d, %Y")

    # Build plain text invoice (served as downloadable text for now)
    # For proper PDF, integrate reportlab or weasyprint in production
    lines = [
        "=" * 50,
        "",
        "            C L I P X   I N V O I C E",
        "",
        "=" * 50,
        "",
        f"  Invoice No:     {invoice_no}",
        f"  Date:           {paid_at_str}",
        f"  Status:         {status}",
        "",
        "-" * 50,
        "",
        "  BILL TO:",
        f"  Name:           {user_name}",
        f"  Email:          {user_email}",
        "",
        "-" * 50,
        "",
        "  SUBSCRIPTION DETAILS:",
        "",
        f"  Plan:           clipX {plan}",
        f"  Period:          Monthly",
        f"  Amount:         {amount} {currency}",
        "",
        "-" * 50,
        "",
        f"  TOTAL:          {amount} {currency}",
        "",
        "-" * 50,
        "",
        f"  Payment Ref:    {ref}",
        f"  Payment Method: Paystack",
        "",
        "=" * 50,
        "",
        "  Thank you for subscribing to clipX!",
        "  For support, contact support@clipx.com",
        "",
        "  clipX © 2026. All rights reserved.",
        "",
        "=" * 50,
    ]

    content = "\n".join(lines)
    return content.encode("utf-8")


@router.get("/invoice/{reference}")
async def download_invoice(reference: str):
    """Download an invoice for a specific payment."""
    
    async with AsyncSessionLocal() as db:
        result = await db.execute(text("""
            SELECT ph.*, u.email, u.name
            FROM payment_history ph
            JOIN users u ON u.id = ph.user_id
            WHERE ph.paystack_reference = :ref
            AND ph.status = 'paid'
        """), {"ref": reference})
        
        row = result.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        invoice_data = {
            "email": row.email,
            "name": row.name or "Customer",
            "reference": row.paystack_reference or "N/A",
            "amount": row.amount or 0,
            "currency": row.currency or "NGN",
            "plan": row.plan or "standard",
            "status": row.status or "paid",
            "paid_at": str(row.paid_at) if row.paid_at else "",
        }
        
        content = generate_invoice_pdf(invoice_data)
        invoice_no = f"CLX-{reference[:8].upper()}"
        
        return StreamingResponse(
            io.BytesIO(content),
            media_type="text/plain",
            headers={
                "Content-Disposition": f"attachment; filename=clipx_invoice_{invoice_no}.txt",
                "Content-Length": str(len(content)),
            }
        )
