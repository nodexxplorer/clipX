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

    async def dispatch(self, request: Request, call_next):
        # Only rate-limit POST to /graphql (where login/register mutations go)
        if request.method == "POST" and request.url.path == "/graphql":
            client_ip = request.client.host if request.client else "unknown"
            now = time.time()
            # Clean old entries
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

            # Periodic cleanup (every ~100 requests, remove stale IPs)
            if len(self._requests) > 200:
                cutoff = now - self.window_seconds
                stale = [ip for ip, times in self._requests.items() if not times or times[-1] < cutoff]
                for ip in stale:
                    del self._requests[ip]

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
    from app.api.routes import movies, proxy, chat
    from app.api.graphql.schema import schema

    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan,
    )

    # Rate limiting — MUST be added BEFORE CORS middleware
    app.add_middleware(RateLimitMiddleware, max_requests=30, window_seconds=60)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(movies.router, prefix=settings.API_V1_STR, tags=["movies"])
    app.include_router(proxy.router, prefix=f"{settings.API_V1_STR}/proxy", tags=["proxy"])
    app.include_router(chat.router, tags=["chat"])

    # GraphQL router
    graphql_app = GraphQLRouter(schema, context_getter=get_context)
    app.include_router(graphql_app, prefix="/graphql")

    @app.get("/")
    async def root():
        return {"message": "Welcome to ClipX Movie API", "status": "online"}

    return app

app = get_app()
