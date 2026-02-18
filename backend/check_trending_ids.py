import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import Trending

async def test():
    session = Session()
    trending = Trending(session)
    res = await trending.get_content_model()
    print("TRENDING IDs:")
    for item in res.items:
        print(f"ID: {item.subjectId} | Title: {item.title}")

if __name__ == "__main__":
    asyncio.run(test())
