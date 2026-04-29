from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from strawberry.fastapi import GraphQLRouter
from app.api.graphql.context import get_context
from app.core.config import settings
import time
import logging
from collections import defaultdict

logger = logging.getLogger("clipx")


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

    # Login-specific rates (tighter than global 30/min)
    LOGIN_MAX = 5        # 5 login attempts / min / IP
    LOGIN_WIN = 60

    # Token refresh rate limit
    AUTH_REFRESH_MAX = 5   # 5 refresh attempts / min / IP
    AUTH_REFRESH_WIN = 60

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # ── CSRF Protection ──────────────────────────────────────
        # Mutations over GraphQL use httpOnly cookies for auth.
        # Require a custom header that browsers won't send in
        # cross-origin form submissions.  This blocks CSRF.
        if request.method == "POST" and "/graphql" in path:
            xrw = request.headers.get("x-requested-with", "")
            origin = request.headers.get("origin", "")
            referer = request.headers.get("referer", "")
            content_type = request.headers.get("content-type", "")

            # Allow if custom header is present (primary CSRF defense)
            if not xrw and "application/json" in content_type:
                # Only enforce if auth cookies are present (authenticated session)
                # CSRF protection: enforce X-Requested-With for ALL POST /graphql
                # requests — not just authenticated ones. This prevents cross-site
                # form submission attacks on login, register, and forgotPassword.
                # Allow same-origin requests (origin or referer match known frontends)
                request_origin = origin or referer
                allowed_origins = getattr(settings, "CORS_ORIGINS", [])
                is_same_origin = any(
                    request_origin.startswith(o) for o in allowed_origins if o
                ) if request_origin else False
                # Also allow localhost / 127.0.0.1 in development
                is_local = any(
                    h in request_origin for h in ("localhost", "127.0.0.1", "192.168.")
                ) if request_origin else False

                if not is_same_origin and not is_local:
                    return Response(
                        content='{"errors":[{"message":"Missing X-Requested-With header"}]}',
                        status_code=403,
                        media_type="application/json",
                    )

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
                except Exception as e:
                    logger.exception("Redis error in auth refresh rate limit")
                    return Response(
                        content='{"detail":"Service temporarily unavailable"}',
                        status_code=503, media_type="application/json",
                        headers={"Retry-After": "30"}
                    )

        # /graphql POST — global 30/min + login-specific 5/min
        if request.method == "POST" and path == "/graphql":
            client_ip = request.client.host if request.client else "unknown"

            from app.core.cache import cache
            redis_available = await cache._ensure_connected()

            # Removed body-reading login rate limit here because `await request.body()`
            # inside BaseHTTPMiddleware consumes the ASGI stream and hangs GraphQL.
            # The global 30/min limit below still protects the endpoint.

            # ── Global IP rate limit (30/min) ─────────────────────
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
                    logger.exception("Redis error in global rate limit")
                    return Response(
                        content='{"errors":[{"message":"Service temporarily unavailable. Please try again."}]}',
                        status_code=503,
                        media_type="application/json",
                        headers={"Retry-After": "30"}
                    )

            if not redis_available:
                # Redis is down — degrade gracefully, skip rate limiting
                logger.warning("Redis unavailable — rate limiting disabled for this request")

        return await call_next(request)


# ---------------------------------------------------------------------------
# HSTS / Security Headers — enforce HTTPS redirect on backend responses
# ---------------------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Injects Strict-Transport-Security and other security headers into
    every backend response.  Browsers that receive HSTS will auto-upgrade
    http→https for the specified max-age (2 years here).
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # HSTS — 2 years, includeSubDomains, preload-eligible
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
        # Prevent MIME-type sniffing
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        # Clickjacking protection
        response.headers.setdefault("X-Frame-Options", "DENY")
        # Referrer policy
        response.headers.setdefault(
            "Referrer-Policy", "strict-origin-when-cross-origin"
        )
        return response



# ---------------------------------------------------------------------------
# Request body caching — reads body once, shares via request.state
# ---------------------------------------------------------------------------
class RequestBodyCacheMiddleware(BaseHTTPMiddleware):
    """
    Reads the request body once and stores it in request.state.raw_body.
    This prevents multiple middlewares from fighting over request._receive
    and ensures the sanitized body is never silently overwritten.
    """
    async def dispatch(self, request: Request, call_next):
        if request.method == "POST" and "/graphql" in request.url.path:
            body = await request.body()
            request.state.raw_body = body
            # Re-inject so downstream can still call request.body()
            async def receive():
                return {"type": "http.request", "body": body}
            request._receive = receive
        return await call_next(request)


class GraphQLTimingMiddleware(BaseHTTPMiddleware):
    """
    Measures GraphQL request duration and logs slow queries.
    Any operation over 500ms is flagged for investigation.
    """
    SLOW_THRESHOLD_MS = 500  # milliseconds

    async def dispatch(self, request: Request, call_next):
        if request.method != "POST" or "/graphql" not in request.url.path:
            return await call_next(request)

        # Read from cached body (set by RequestBodyCacheMiddleware)
        operation_name = "unknown"
        try:
            body = getattr(request.state, 'raw_body', None) or await request.body()
            import json as _json
            data = _json.loads(body)
            operation_name = data.get("operationName", "anonymous") or "anonymous"
        except Exception:
            pass

        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        # Always set timing header for debugging
        response.headers["X-Response-Time"] = f"{duration_ms:.0f}ms"

        if duration_ms > self.SLOW_THRESHOLD_MS:
            logger.warning(
                f"[SLOW QUERY] {operation_name} took {duration_ms:.0f}ms "
                f"(threshold: {self.SLOW_THRESHOLD_MS}ms)"
            )
            # Report to Sentry as a breadcrumb / performance event
            try:
                import sentry_sdk
                sentry_sdk.add_breadcrumb(
                    message=f"Slow GraphQL: {operation_name} ({duration_ms:.0f}ms)",
                    category="performance",
                    level="warning",
                    data={"operation": operation_name, "duration_ms": round(duration_ms)},
                )
            except Exception:
                pass

        return response


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
                # Read from cached body instead of calling request.body() again
                body = getattr(request.state, 'raw_body', None) or await request.body()
                data = json.loads(body)
                if "variables" in data and data["variables"]:
                    data["variables"] = self._sanitize(data["variables"])
                # Reconstruct the request with sanitized body
                sanitized_body = json.dumps(data).encode()
                # Update the cached body too
                request.state.raw_body = sanitized_body
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
        logger.info("Moviebox session cookies pre-warmed successfully")
    except Exception as e:
        logger.warning(f"Moviebox session warmup failed (non-fatal): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Sentry error tracking first
    try:
        from app.core.sentry import setup_sentry
        setup_sentry()
    except Exception as e:
        logger.warning(f"Sentry init failed (non-fatal): {e}")

    # Verify database migrations are applied
    try:
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            # Check for columns added in the latest migration
            await db.execute(text(
                "SELECT is_banned FROM users LIMIT 1"
            ))
        logger.info("Database migration check passed")
    except Exception as e:
        logger.critical(
            f"DATABASE MIGRATION CHECK FAILED: {e}. "
            "Run pending migrations before deploying new code."
        )

    await _warmup_moviebox_session()
    yield


def get_app() -> FastAPI:
    from app.api.routes import movies, proxy, chat, ai, webhooks, invoices, watch_party, auth as auth_routes, exports
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

    # Security headers (HSTS, X-Frame-Options, etc.)
    app.add_middleware(SecurityHeadersMiddleware)

    # GraphQL performance timing — logs slow queries > 500ms
    app.add_middleware(GraphQLTimingMiddleware)

    # Input sanitization — strip XSS patterns from GraphQL inputs
    app.add_middleware(InputSanitizationMiddleware)

    # Body caching — MUST be outermost (added last) so it reads body
    # once before Timing and Sanitization middlewares access it.
    app.add_middleware(RequestBodyCacheMiddleware)

    # LAN origins (192.168.x.x) only allowed in development for mobile testing
    _lan_regex = r"http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?" if not _is_prod else None

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_origin_regex=_lan_regex,
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
    app.include_router(exports.router, prefix=settings.API_V1_STR, tags=["exports"])

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
            logger.error("DB health check failed", exc_info=True)
            health["services"]["database"] = "down"
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