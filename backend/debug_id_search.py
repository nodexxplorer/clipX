import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import Search
from moviebox_api.constants import SubjectType

async def test():
    session = Session()
    # Using the ID from Squid Game found earlier
    item_id = '3089349649633325145248800'
    print(f"Searching for ID: {item_id}")
    s = Search(session, item_id, SubjectType.ALL)
    res = await s.get_content_model()
    print(f"Items found: {len(res.items)}")
    for item in res.items:
        print(f"Match: {item.title} (ID: {item.id})")

if __name__ == "__main__":
    asyncio.run(test())
