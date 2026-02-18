import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import Trending

async def test():
    session = Session()
    trending = Trending(session)
    res = await trending.get_content_model()
    for item in res.items:
        if "Bad Guys" in item.title:
            print(f"FOUND: {item.title} | ID: {item.subjectId}")

if __name__ == "__main__":
    asyncio.run(test())
