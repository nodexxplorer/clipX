import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import MovieDetails, TVSeriesDetails

async def test():
    session = Session()
    # ID for "The Sandman" (TV Series) from trending
    mid = '2190807691784770592' 
    
    # Try with "any" as detailPath
    url_any = f"/detail/any?id={mid}"
    print(f"Testing URL: {url_any}")
    
    # We need to try both MovieDetails and TVSeriesDetails because the API might be strict
    try:
        print("Trying TVSeriesDetails...")
        details = TVSeriesDetails(url_any, session)
        res = await details.get_content_model()
        print(f"SUCCESS! Title: {res.resData.subject.title}")
        return
    except Exception as e:
        print(f"FAILED (TV): {e}")

    try:
        print("Trying MovieDetails...")
        details = MovieDetails(url_any, session)
        res = await details.get_content_model()
        print(f"SUCCESS! Title: {res.resData.subject.title}")
    except Exception as e:
        print(f"FAILED (Movie): {e}")

if __name__ == "__main__":
    asyncio.run(test())
