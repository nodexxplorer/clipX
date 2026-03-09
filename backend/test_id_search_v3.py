import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import Search
from moviebox_api.constants import SubjectType

async def test():
    session = Session()
    # ID for "All American"
    mid = '1167223938976469784'
    print(f"Searching for Numeric ID as keyword: {mid}")
    s = Search(session, mid, SubjectType.ALL)
    try:
        res = await s.get_content_model()
        print(f"Items found: {len(res.items)}")
        for item in res.items:
            print(f"ID: {item.subjectId} | Title: {item.title}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test())
