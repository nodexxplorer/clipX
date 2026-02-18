import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import Trending, MovieDetails

async def test():
    session = Session()
    trending = Trending(session)
    res = await trending.get_content_model()
    if res.items:
        it = res.items[0]
        print(f"Testing detail for: {it.title}")
        d = MovieDetails(it, session)
        details = await d.get_content_model()
        dur = details.resData.subject.duration
        print(f"DURATION TYPE: {type(dur)} | VALUE: {dur}")

if __name__ == "__main__":
    asyncio.run(test())
