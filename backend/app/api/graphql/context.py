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
        if not self._db:
            self._db = AsyncSessionLocal()
        return self._db

    @property
    async def user(self) -> Optional[User]:
        if self._user:
            return self._user
        
        request = self.request
        if not request:
            return None
            
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
            
        token = auth_header.split(" ")[1]
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            return None
            
        db = await self.get_db()
        result = await db.execute(select(User).where(User.email == payload["sub"]))
        self._user = result.scalars().first()
        return self._user

async def get_context() -> Context:
    return Context()
