import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import Search
from moviebox_api.constants import SubjectType

async def test(mid):
    session = Session()
    print(f"Searching for Numeric ID: {mid}")
    s = Search(session, mid, SubjectType.ALL)
    try:
        res = await s.get_content_model()
        print(f"Items found: {len(res.items)}")
        for item in res.items:
            print(f"FOUND ID: {item.subjectId} | TITLE: {item.title}")
            if str(item.subjectId) == str(mid):
                print(">>> MATCH FOUND!")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    import sys
    mid = sys.argv[1] if len(sys.argv) > 1 else '2190807691784770592'
    asyncio.run(test(mid))
