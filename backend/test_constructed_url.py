import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import MovieDetails, TVSeriesDetails

async def test():
    session = Session()
    # ID and slug for "The Bad Guys" from my previous search test
    mid = '2805382677510119064'
    slug = 'the-bad-guy-Wp4edfjGel3'
    
    url = f"/detail/{slug}?id={mid}"
    print(f"Testing URL: {url}")
    try:
        details = MovieDetails(url, session)
        res = await details.get_content_model()
        print(f"SUCCESS! Title: {res.resData.subject.title}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test())
