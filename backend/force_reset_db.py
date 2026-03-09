import asyncio
from sqlalchemy import text
from app.core.database import engine

async def force_reset():
    tables = ["recently_viewed", "history", "watchlist", "series", "movies", "users"]
    async with engine.begin() as conn:
        print("Disabling foreign key checks (Postgres)...")
        # In Postgres, we use CASCADE in the DROP command
        for table in tables:
            print(f"Dropping {table} CASCADE...")
            await conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
        
        print("Re-creating all tables...")
        from app.models.database import Base
        await conn.run_sync(Base.metadata.create_all)
    print("DONE!")

if __name__ == "__main__":
    asyncio.run(force_reset())
