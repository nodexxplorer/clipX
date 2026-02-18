import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import MovieDetails

async def test():
    session = Session()
    # item_id = '70521424' # The Bad Guys (found by search)
    item_id = '1167223938976469784' # Twelve
    url = f"https://h5.aoneroom.com/subject/{item_id}"
    print(f"Testing MovieDetails with URL: {url}")
    try:
        details = MovieDetails(url, session)
        res = await details.get_content_model()
        print(f"SUCCESS: {res.resData.subject.title}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test())
