import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import MovieDetails

async def test():
    session = Session()
    # "Twelve" ID
    item_id = '1167223938976469784'
    print(f"Testing MovieDetails with ID: {item_id}")
    try:
        details = MovieDetails(item_id, session)
        res = await details.get_content_model()
        print(f"SUCCESS: {res.resData.subject.title}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test())
