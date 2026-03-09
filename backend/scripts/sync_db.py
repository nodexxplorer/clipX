import asyncio
from app.core.database import engine
from app.models.database import Base

async def init_db():
    async with engine.begin() as conn:
        print("Creating new tables if they do not exist...")
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables updated.")

if __name__ == "__main__":
    asyncio.run(init_db())
