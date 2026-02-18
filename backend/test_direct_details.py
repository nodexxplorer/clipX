import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import MovieDetails

class MockItem:
    def __init__(self, item_id):
        self.subjectId = item_id
        self.subjectType = 1 # 1 = Movie

async def test():
    session = Session()
    # Using Squid Game ID found earlier
    item_id = '3089349649633325145248800'
    print(f"Testing direct details fetch for ID: {item_id}")
    mock_item = MockItem(item_id)
    details_fetcher = MovieDetails(mock_item, session)
    try:
        res = await details_fetcher.get_content_model()
        print(f"Success! Title: {res.resData.subject.title}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test())
