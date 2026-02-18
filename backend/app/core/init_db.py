import asyncio
from app.core.database import engine
from app.models.database import Base

async def init_db():
    async with engine.begin() as conn:
        # This will create tables if they don't exist
        # Note: In production you should use Alembic
        await conn.run_sync(Base.metadata.create_all)
    print("Database initialized!")

if __name__ == "__main__":
    asyncio.run(init_db())
