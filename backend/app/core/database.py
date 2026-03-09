from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Replace postgresql:// with postgresql+asyncpg:// if needed
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
else:
    ASYNC_DATABASE_URL = DATABASE_URL

engine = create_async_engine(ASYNC_DATABASE_URL, echo=False, poolclass=NullPool, connect_args={"prepared_statement_cache_size": 0})
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Context manager version for use outside of FastAPI dependency injection (e.g. WebSockets)
async_session = AsyncSessionLocal

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
