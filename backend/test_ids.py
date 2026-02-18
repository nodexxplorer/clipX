import asyncio
from app.services.movie_service import movie_service

async def test_ids():
    resp = await movie_service.get_trending()
    print("TRENDING IDs:")
    for item in resp.results:
        print(f"ID: {item.id} | Title: {item.title}")

if __name__ == "__main__":
    asyncio.run(test_ids())
