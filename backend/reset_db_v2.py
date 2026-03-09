import asyncio
from sqlalchemy import text
from app.core.database import engine

async def drop_all_cascade():
    tables = ["recently_viewed", "history", "watchlist", "series", "movies", "users"]
    async with engine.begin() as conn:
        for table in tables:
            print(f"Dropping {table} CASCADE...")
            try:
                await conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
            except Exception as e:
                print(f"Failed to drop {table}: {e}")
        print("Creating tables...")
        from app.models.database import Base
        await conn.run_sync(Base.metadata.create_all)
    print("Database reset successfully!")

if __name__ == "__main__":
    asyncio.run(drop_all_cascade())
