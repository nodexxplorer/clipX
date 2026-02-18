import asyncio
from app.core.database import engine
from app.models.database import Base
from sqlalchemy import text

async def clean_db():
    async with engine.begin() as conn:
        # Drop all tables in correct order or with cascading
        # Using raw SQL is often easier for a full wipe
        await conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
        print("Database wiped successfully!")
        
        # Re-create tables
        await conn.run_sync(Base.metadata.create_all)
        print("Database re-initialized!")

if __name__ == "__main__":
    asyncio.run(clean_db())
