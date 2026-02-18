import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import MovieDetails
from moviebox_api.constants import SubjectType
from moviebox_api.models.search import SearchResultsItem

async def test():
    session = Session()
    # "Twelve" ID
    mid = '2190807691784770592' 
    print(f"Testing MovieDetails with SearchResultsItem for ID: {mid}")
    
    # We need to see what SearchResultsItem expects. Usually pydantic models take kwargs.
    try:
        item = SearchResultsItem(subjectId=mid, subjectType=SubjectType.MOVIES)
        details_fetcher = MovieDetails(item, session)
        res = await details_fetcher.get_content_model()
        print(f"SUCCESS! Title: {res.resData.subject.title}")
    except Exception as e:
        print(f"FAILED (Movie): {e}")

    try:
        item_tv = SearchResultsItem(subjectId=mid, subjectType=SubjectType.TV_SERIES)
        from moviebox_api.core import TVSeriesDetails
        details_fetcher = TVSeriesDetails(item_tv, session)
        res = await details_fetcher.get_content_model()
        print(f"SUCCESS! Title: {res.resData.subject.title}")
    except Exception as e:
        print(f"FAILED (Series): {e}")

if __name__ == "__main__":
    asyncio.run(test())
