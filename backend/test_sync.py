import asyncio
from app.services.movie_service import movie_service
from app.core.database import AsyncSessionLocal

async def test():
    async with AsyncSessionLocal() as db:
        print("Fetching trending and syncing to DB...")
        try:
            res = await movie_service.get_trending(db=db)
            print(f"Success! Got {len(res.results)} items.")
            for item in res.results[:3]:
                print(f"- {item.title} (ID: {item.id}, Path: {item.detail_path})")
        except Exception as e:
            print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test())
