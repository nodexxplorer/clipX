from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from app.api.graphql.context import get_context
from app.core.config import settings

# Lazy imports to prevent hang at module level in some environments
def get_app() -> FastAPI:
    from app.api.routes import movies
    from app.api.graphql.schema import schema
    
    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json"
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.include_router(movies.router, prefix=settings.API_V1_STR, tags=["movies"])
    
    # GraphQL router
    graphql_app = GraphQLRouter(schema, context_getter=get_context)
    app.include_router(graphql_app, prefix="/graphql")
    
    @app.get("/")
    async def root():
        return {"message": "Welcome to ClipX Movie API", "status": "online"}
        
    return app

app = get_app()
