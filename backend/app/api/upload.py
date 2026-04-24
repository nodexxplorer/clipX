# backend/app/api/upload.py
# Section 11: Profile picture upload endpoint — stores to local filesystem or Cloudinary
import os
import logging
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.core.auth import get_current_user

logger = logging.getLogger("clipx")

router = APIRouter(prefix="/api/upload", tags=["upload"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "avatars")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE = 5 * 1024 * 1024  # 5MB
BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:8000")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def _try_cloudinary_upload(file_bytes: bytes, filename: str) -> str | None:
    """Attempt Cloudinary upload if configured, returns URL or None."""
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if not all([cloud_name, api_key, api_secret]):
        return None

    try:
        import cloudinary
        import cloudinary.uploader

        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
        )

        result = cloudinary.uploader.upload(
            file_bytes,
            folder="clipx/avatars",
            public_id=f"avatar_{filename}",
            overwrite=True,
            resource_type="image",
            transformation=[
                {"width": 400, "height": 400, "crop": "fill", "gravity": "face"},
                {"quality": "auto", "fetch_format": "auto"},
            ],
        )
        return result.get("secure_url")
    except Exception as e:
        logger.warning(f"[Cloudinary] Upload failed, falling back to local: {e}")
        return None


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    """Upload a profile picture. Tries Cloudinary first, falls back to local storage."""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_TYPES)}"
        )

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    # Generate unique filename
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    unique_name = f"{user.id}_{uuid.uuid4().hex[:8]}"
    full_filename = f"{unique_name}.{ext}"

    # Try Cloudinary first
    cloud_url = await _try_cloudinary_upload(contents, unique_name)

    if cloud_url:
        avatar_url = cloud_url
    else:
        # Fallback: save to local filesystem
        filepath = os.path.join(UPLOAD_DIR, full_filename)
        with open(filepath, "wb") as f:
            f.write(contents)
        avatar_url = f"{BASE_URL}/uploads/avatars/{full_filename}"

    # Update user avatar in database
    try:
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text

        async with AsyncSessionLocal() as db:
            await db.execute(
                text("UPDATE users SET avatar = :url WHERE id = :uid"),
                {"url": avatar_url, "uid": str(user.id)},
            )
            await db.commit()
    except Exception as e:
        logger.exception("[Upload] DB update failed")
        try:
            import sentry_sdk
            sentry_sdk.capture_exception(e)
        except Exception:
            pass
        # Still return the URL even if DB update fails

    return {"success": True, "url": avatar_url, "avatar_url": avatar_url}
