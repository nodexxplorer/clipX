import asyncio
from sqlalchemy import text
from app.core.database import engine

async def add_bio_column():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN bio TEXT"))
            print("Successfully added bio column to users table")
        except Exception as e:
            print(f"Error or already exists: {e}")

if __name__ == "__main__":
    asyncio.run(add_bio_column())
