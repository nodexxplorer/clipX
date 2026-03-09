import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import Trending

async def test():
    session = Session()
    trending = Trending(session)
    res = await trending.get_content_model()
    if res.items:
        it = res.items[0]
        print(f"Title: {it.title}")
        print(f"ID: {it.subjectId}")
        print(f"detailPath: {it.detailPath}")
        print(f"page_url: {it.page_url}")

if __name__ == "__main__":
    asyncio.run(test())
