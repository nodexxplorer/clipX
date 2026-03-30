import json
from typing import Any, Optional
import redis.asyncio as aioredis
from app.core.config import settings


class RedisCache:
    """
    Thin async Redis wrapper with graceful degradation.
    redis.from_url() is lazy — it doesn't open a socket until the first command.
    We therefore attempt a PING on first use and disable the client if it fails.
    """
    def __init__(self):
        self.redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379")
        self._redis: Optional[aioredis.Redis] = None
        self._enabled: bool = False
        self._initialised: bool = False

    async def _ensure_connected(self) -> bool:
        """Lazily connect and verify Redis is reachable. Returns True if usable."""
        if self._initialised:
            return self._enabled
        self._initialised = True
        try:
            self._redis = aioredis.from_url(self.redis_url, decode_responses=True)
            await self._redis.ping()
            self._enabled = True
            print("[CACHE] Redis connected successfully")
        except Exception as e:
            print(f"[CACHE] Redis unavailable, falling back to no-cache mode: {e}")
            self._redis = None
            self._enabled = False
        return self._enabled

    async def get(self, key: str) -> Optional[Any]:
        if not await self._ensure_connected():
            return None
        try:
            data = await self._redis.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            print(f"[CACHE] Error reading {key}: {e}")
            return None

    async def set(self, key: str, value: Any, expire: int = 300) -> None:
        if not await self._ensure_connected():
            return
        try:
            await self._redis.setex(key, expire, json.dumps(value))
        except Exception as e:
            print(f"[CACHE] Error writing {key}: {e}")


cache = RedisCache()
