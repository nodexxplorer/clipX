from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
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

# ─── Connection pool configuration ───────────────────────────────────
#
# Previously we used NullPool, which means EVERY database operation
# opens a brand-new TCP+TLS connection to Supabase/Postgres. Each
# handshake costs 50-200ms, making even trivial queries appear slow.
#
# Now we use a real connection pool:
#   - pool_size=5       → 5 persistent connections kept warm
#   - max_overflow=10   → up to 15 total during traffic spikes
#   - pool_recycle=1800 → recycle connections every 30 min (keeps
#                         Supabase pgBouncer happy)
#   - pool_pre_ping=True → test connections before use (avoids
#                          "connection closed" errors after idle)
#
# Supabase pgBouncer requirements:
#   - prepared_statement_cache_size=0 (pgBouncer can't handle prepared stmts)
#   - statement_cache_size=0
#   - command_timeout=15s (prevents infinite hangs)
# ─────────────────────────────────────────────────────────────────────

engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=30,
    pool_recycle=1800,
    pool_pre_ping=True,
    connect_args={
        "prepared_statement_cache_size": 0,  # Required for Supabase pgBouncer
        "statement_cache_size": 0,
        "command_timeout": 15,               # Timeout individual queries after 15s
    },
)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Context manager version for WebSockets etc.
async_session = AsyncSessionLocal

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
