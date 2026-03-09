import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import Trending

async def test():
    session = Session()
    trending = Trending(session)
    res = await trending.get_content_model()
    for item in res.items:
        print(f"Title: {item.title:20} | ID: {item.subjectId} | Path: {item.detailPath}")

if __name__ == "__main__":
    asyncio.run(test())
