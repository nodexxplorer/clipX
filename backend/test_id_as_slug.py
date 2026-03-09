import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import MovieDetails, TVSeriesDetails

async def test():
    session = Session()
    # ID for "All American" (Series)
    mid = '1167223938976469784' 
    
    # Try ID as slug
    url = f"/detail/{mid}?id={mid}"
    print(f"Testing URL: {url}")
    try:
        # Try both
        print("Trying TVSeriesDetails...")
        details = TVSeriesDetails(url, session)
        res = await details.get_content_model()
        print(f"SUCCESS! Title: {res.resData.subject.title}")
    except Exception as e:
        print(f"FAILED (TV): {e}")

    try:
        print("\nTrying MovieDetails...")
        details = MovieDetails(url, session)
        res = await details.get_content_model()
        print(f"SUCCESS! Title: {res.resData.subject.title}")
    except Exception as e:
        print(f"FAILED (Movie): {e}")

if __name__ == "__main__":
    asyncio.run(test())
