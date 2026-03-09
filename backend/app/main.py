from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from app.api.graphql.context import get_context
from app.core.config import settings


async def _warmup_moviebox_session():
    """Pre-warm the moviebox session so CDN cookies are ready before the first request."""
    try:
        from app.services.movie_service import movie_service
        # Trigger the cookie population by calling ensure_cookies_are_assigned
        await movie_service.provider.session.ensure_cookies_are_assigned()
        print("✅ Moviebox session cookies pre-warmed successfully")
    except Exception as e:
        print(f"⚠️  Moviebox session warmup failed (non-fatal): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await _warmup_moviebox_session()
    yield


# Lazy imports to prevent hang at module level in some environments
def get_app() -> FastAPI:
    from app.api.routes import movies, proxy, chat
    from app.api.graphql.schema import schema

    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan,
    )

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
