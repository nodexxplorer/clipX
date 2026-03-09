import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import MovieDetails, TVSeriesDetails

async def test():
    session = Session()
    # ID for "All American" (Series)
    mid = '1167223938976469784' 
    
    # URL that should pass the regex
    url = f"/detail/any-slug?id={mid}"
    print(f"Testing URL: {url}")
    try:
        # It's a series, but let's try TVSeriesDetails
        details = TVSeriesDetails(url, session)
        res = await details.get_content_model()
        print(f"SUCCESS! Title: {res.resData.subject.title}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test())
