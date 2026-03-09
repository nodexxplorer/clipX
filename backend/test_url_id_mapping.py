import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import MovieDetails, TVSeriesDetails

async def test():
    session = Session()
    # ID for "The Sandman" (TV Series) from trending
    mid = '2190807691784770592' 
    
    # Try TV Series detail path
    url_tv = f"/detail/moviebox/detail?id={mid}&type=%2Ftv%2Fdetail"
    print(f"Testing URL: {url_tv}")
    try:
        details = TVSeriesDetails(url_tv, session)
        res = await details.get_content_model()
        print(f"SUCCESS (TV)! Title: {res.resData.subject.title}")
    except Exception as e:
        print(f"FAILED (TV): {e}")

    # Try Movie detail path
    url_movie = f"/detail/moviebox/detail?id={mid}&type=%2Fmovie%2Fdetail"
    print(f"\nTesting URL: {url_movie}")
    try:
        details = MovieDetails(url_movie, session)
        res = await details.get_content_model()
        print(f"SUCCESS (Movie)! Title: {res.resData.subject.title}")
    except Exception as e:
        print(f"FAILED (Movie): {e}")

if __name__ == "__main__":
    asyncio.run(test())
