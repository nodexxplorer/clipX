import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import MovieDetails
from moviebox_api.constants import SubjectType

class MockItem:
    def __init__(self, subject_id, subject_type):
        self.subjectId = subject_id
        self.subjectType = subject_type

async def test():
    session = Session()
    # "Twelve" ID from previous trending test
    mid = '2190807691784770592' 
    print(f"Testing MovieDetails with MockItem for ID: {mid}")
    
    item = MockItem(mid, SubjectType.MOVIES)
    try:
        details_fetcher = MovieDetails(item, session)
        res = await details_fetcher.get_content_model()
        print(f"SUCCESS! Title: {res.resData.subject.title}")
    except Exception as e:
        print(f"FAILED: {e}")
        
    print("\nTrying as TV SERIES...")
    item_tv = MockItem(mid, SubjectType.TV_SERIES)
    try:
        from moviebox_api.core import TVSeriesDetails
        details_fetcher = TVSeriesDetails(item_tv, session)
        res = await details_fetcher.get_content_model()
        print(f"SUCCESS! Title: {res.resData.subject.title}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test())
