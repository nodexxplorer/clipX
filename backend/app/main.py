from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from strawberry.fastapi import GraphQLRouter
from app.api.graphql.context import get_context
from app.core.config import settings
import time
from collections import defaultdict


# ---------------------------------------------------------------------------
# Simple in-memory rate limiter — protects login/register from brute-force
# ---------------------------------------------------------------------------
class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Limits requests from a single IP to critical endpoints.
    - /graphql receives ALL mutations (login, register, etc.)
      so we rate-limit POST /graphql globally at 30 req/min/IP.
    - Other endpoints are not limited.
    """
    def __init__(self, app, max_requests: int = 30, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)      

    # Tighter limits per endpoint type
    AUTH_REFRESH_MAX = 5   # token refresh — 5/min/IP
    AUTH_REFRESH_WIN = 60

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # /api/auth/refresh — tighter limit (5/min) to protect token-vending endpoint
        if request.method == "POST" and path == "/api/auth/refresh":
            client_ip = request.client.host if request.client else "unknown"
            from app.core.cache import cache
            redis_ok = await cache._ensure_connected()
            if redis_ok and cache._redis:
                try:
                    rk = f"rate_limit:refresh:{client_ip}"
                    cur = await cache._redis.get(rk)
                    if cur and int(cur) >= self.AUTH_REFRESH_MAX:
                        return Response(
                            content='{"detail":"Too many refresh attempts. Please wait."}',
                            status_code=429, media_type="application/json",
                            headers={"Retry-After": str(self.AUTH_REFRESH_WIN)}
                        )
                    pipe = cache._redis.pipeline()
                    pipe.incr(rk)
                    if not cur:
                        pipe.expire(rk, self.AUTH_REFRESH_WIN)
                    await pipe.execute()
                except Exception:
                    pass  # fail open on Redis errors

        # /graphql — 30/min global limit (login, register, all mutations)
        if request.method == "POST" and path == "/graphql":
            client_ip = request.client.host if request.client else "unknown"

            from app.core.cache import cache
            redis_available = await cache._ensure_connected()
            if redis_available and cache._redis:
                try:
                    redis_key = f"rate_limit:{client_ip}"
                    current = await cache._redis.get(redis_key)
                    if current and int(current) >= self.max_requests:
                        return Response(
                            content='{"errors":[{"message":"Too many requests. Please try again later."}]}',
                            status_code=429,
                            media_type="application/json",
                            headers={"Retry-After": str(self.window_seconds)}
                        )
                    pipe = cache._redis.pipeline()
                    pipe.incr(redis_key)
                    if not current:
                        pipe.expire(redis_key, self.window_seconds)
                    await pipe.execute()
                except Exception as e:
                    print(f"[RATE LIMIT] Redis error, falling back to in-memory: {e}")
                    # fall through to in-memory below
                    redis_available = False

            if not redis_available:
                now = time.time()
                self._requests[client_ip] = [
                    t for t in self._requests[client_ip]
                    if now - t < self.window_seconds
                ]
                if len(self._requests[client_ip]) >= self.max_requests:
                    return Response(
                        content='{"errors":[{"message":"Too many requests. Please try again later."}]}',
                        status_code=429,
                        media_type="application/json",
                        headers={"Retry-After": str(self.window_seconds)}
                    )
                self._requests[client_ip].append(now)

                # Periodic cleanup
                if len(self._requests) > 200:
                    cutoff = now - self.window_seconds
                    stale = [ip for ip, times in self._requests.items() if not times or times[-1] < cutoff]
                    for ip in stale:
                        del self._requests[ip]

        return await call_next(request)

# ---------------------------------------------------------------------------
# Input sanitization — strip dangerous HTML/script tags from GraphQL inputs
# ---------------------------------------------------------------------------
import re
import json

class InputSanitizationMiddleware(BaseHTTPMiddleware):
    """
    Sanitizes string inputs in GraphQL requests to prevent XSS.
    Strips <script>, onclick, onerror, javascript: etc.
    """
    DANGEROUS_PATTERNS = [
        re.compile(r'<\s*script[^>]*>.*?<\s*/\s*script\s*>', re.I | re.S),
        re.compile(r'<\s*script[^>]*>', re.I),
        re.compile(r'javascript\s*:', re.I),
        re.compile(r'on\w+\s*=', re.I),  # onclick=, onerror=, etc.
        re.compile(r'<\s*iframe[^>]*>', re.I),
        re.compile(r'<\s*object[^>]*>', re.I),
        re.compile(r'<\s*embed[^>]*>', re.I),
    ]

    def _sanitize(self, value):
        if isinstance(value, str):
            for pattern in self.DANGEROUS_PATTERNS:
                value = pattern.sub('', value)
            return value.strip()
        elif isinstance(value, dict):
            return {k: self._sanitize(v) for k, v in value.items()}
        elif isinstance(value, list):
            return [self._sanitize(v) for v in value]
        return value

    async def dispatch(self, request: Request, call_next):
        if request.method == "POST" and "/graphql" in request.url.path:
            try:
                body = await request.body()
                data = json.loads(body)
                if "variables" in data and data["variables"]:
                    data["variables"] = self._sanitize(data["variables"])
                # Reconstruct the request with sanitized body
                sanitized_body = json.dumps(data).encode()
                # Replace the request's receive with our sanitized body
                async def receive():
                    return {"type": "http.request", "body": sanitized_body}
                request._receive = receive
            except (json.JSONDecodeError, Exception):
                pass  # If we can't parse, let it through for the endpoint to handle
        return await call_next(request)


async def _warmup_moviebox_session():
    """Pre-warm the moviebox session so CDN cookies are ready before the first request."""
    try:
        from app.services.movie_service import movie_service
        await movie_service.provider.session.ensure_cookies_are_assigned()
        print("[OK] Moviebox session cookies pre-warmed successfully")
    except Exception as e:
        print(f"[WARN] Moviebox session warmup failed (non-fatal): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await _warmup_moviebox_session()
    yield


def get_app() -> FastAPI:
    from app.api.routes import movies, proxy, chat, ai, webhooks, invoices, watch_party, auth as auth_routes
    from app.api.graphql.schema import schema

    # H6 FIX: OpenAPI schema, Swagger UI (/docs), and ReDoc (/redoc) are
    # disabled in production. They enumerate every endpoint and parameter —
    # useful for development, a reconnaissance gift in production.
    import os
    _env = os.getenv("ENV", "development")
    _is_prod = _env == "production"

    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=None if _is_prod else f"{settings.API_V1_STR}/openapi.json",
        docs_url=None if _is_prod else "/docs",
        redoc_url=None if _is_prod else "/redoc",
        lifespan=lifespan,
    )

    # Rate limiting — MUST be added BEFORE CORS middleware
    app.add_middleware(RateLimitMiddleware, max_requests=30, window_seconds=60)

    # Input sanitization — strip XSS patterns from GraphQL inputs
    app.add_middleware(InputSanitizationMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_routes.router, prefix="/api", tags=["auth"])
    app.include_router(movies.router, prefix=settings.API_V1_STR, tags=["movies"])
    app.include_router(proxy.router, prefix=f"{settings.API_V1_STR}/proxy", tags=["proxy"])
    app.include_router(chat.router, tags=["chat"])
    app.include_router(ai.router, prefix=settings.API_V1_STR, tags=["ai"])
    app.include_router(webhooks.router, prefix=settings.API_V1_STR, tags=["webhooks"])
    app.include_router(invoices.router, prefix=settings.API_V1_STR, tags=["invoices"])
    app.include_router(watch_party.router, tags=["watch_party"])

    # GraphQL router
    graphql_app = GraphQLRouter(schema, context_getter=get_context)
    app.include_router(graphql_app, prefix="/graphql")

    @app.get("/")
    async def root():
        return {"message": "Welcome to ClipX Movie API", "status": "online"}

    @app.get("/health")
    async def health_check():
        """Health check endpoint for monitoring and load balancers."""
        import os
        from datetime import datetime

        health = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": os.getenv("APP_VERSION", "2.0.0"),
            "services": {}
        }

        # Check database connectivity
        try:
            from app.core.database import AsyncSessionLocal
            from sqlalchemy import text
            async with AsyncSessionLocal() as db:
                await db.execute(text("SELECT 1"))
            health["services"]["database"] = "up"
        except Exception as e:
            health["services"]["database"] = f"down: {str(e)[:100]}"
            health["status"] = "degraded"

        # Check movie service
        try:
            from app.services.movie_service import movie_service
            if movie_service and movie_service.provider:
                health["services"]["movie_provider"] = "up"
            else:
                health["services"]["movie_provider"] = "not initialized"
        except Exception:
            health["services"]["movie_provider"] = "down"

        return health

    return app

app = get_app()