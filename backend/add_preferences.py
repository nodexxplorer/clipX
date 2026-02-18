import asyncio
from sqlalchemy import text
from app.core.database import engine

async def add_preferences_column():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb"))
            print("Successfully added preferences column to users table")
        except Exception as e:
            print(f"Error or already exists: {e}")

if __name__ == "__main__":
    asyncio.run(add_preferences_column())
