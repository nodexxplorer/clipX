import asyncio
from sqlalchemy import text
from app.core.database import engine

async def update_schema():
    queries = [
        "ALTER TABLE movies ADD COLUMN IF NOT EXISTS detail_path VARCHAR(500)",
        "ALTER TABLE movies ADD COLUMN IF NOT EXISTS subject_type INTEGER DEFAULT 1",
        "ALTER TABLE series ADD COLUMN IF NOT EXISTS detail_path VARCHAR(500)",
        "ALTER TABLE series ADD COLUMN IF NOT EXISTS subject_type INTEGER DEFAULT 2"
    ]
    async with engine.begin() as conn:
        for q in queries:
            print(f"Running: {q}")
            try:
                await conn.execute(text(q))
            except Exception as e:
                print(f"Error: {e}")
    print("Schema update done!")

if __name__ == "__main__":
    asyncio.run(update_schema())
