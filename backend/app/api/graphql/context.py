# app/api/graphql/context.py

import uuid as _uuid
from strawberry.fastapi import BaseContext
from typing import Optional, Any
from app.core.database import AsyncSessionLocal
from app.core.auth import decode_access_token
from app.models.database import User
from sqlalchemy.future import select


class Context(BaseContext):
    def __init__(self):
        super().__init__()
        self._user: Optional[User] = None
        self._db: Optional[Any] = None

    async def get_db(self):
        """Lazily open a DB session. Reuse within the same request."""
        if not self._db:
            self._db = AsyncSessionLocal()
        return self._db

    async def close_db(self):
        """Close the DB session. Called by the lifespan cleanup hook."""
        if self._db:
            try:
                await self._db.close()
            except Exception:
                pass
            self._db = None

    @property
    async def user(self) -> Optional[User]:
        if self._user:
            return self._user

        request = self.request
        if not request:
            return None

        # --- Token extraction (cookie-first, then Authorization header) ----
        # 1. httpOnly cookie — set by the login/register/googleAuth mutations.
        #    JS cannot read this value; it is sent automatically by the browser.
        token = request.cookies.get("auth_token")

        # 2. Authorization: Bearer <token> — used by the mobile app and any
        #    API client that cannot use cookies (e.g. curl, Postman).
        if not token:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header[7:]

        if not token:
            return None

        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            return None

        # H1 FIX: sub is now the user UUID string, not the email address.
        # We parse it as a UUID to catch malformed tokens early and to use
        # SQLAlchemy's typed UUID comparison (avoids implicit cast issues).
        try:
            user_id = _uuid.UUID(payload["sub"])
        except (ValueError, AttributeError):
            # sub is not a valid UUID — this is an old token issued before the
            # H1 fix was deployed, or a tampered token. Reject it.
            return None

        db = await self.get_db()
        result = await db.execute(select(User).where(User.id == user_id))
        self._user = result.scalars().first()
        return self._user


async def get_context() -> Context:
    return Context()