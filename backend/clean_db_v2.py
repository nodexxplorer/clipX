import asyncio
from app.core.database import engine
from app.models.database import Base
from sqlalchemy import text

async def clean_db():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("DROP TABLE IF EXISTS watchlist CASCADE"))
            await conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
            await conn.execute(text("DROP TABLE IF EXISTS movies CASCADE"))
            await conn.execute(text("DROP TABLE IF EXISTS series CASCADE"))
            print("Tables dropped.")
        except Exception as e:
            print(f"Error dropping tables: {e}")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Schema re-created.")

if __name__ == "__main__":
    asyncio.run(clean_db())
