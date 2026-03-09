import asyncio
import sys
from moviebox_api.requests import Session
from moviebox_api.core import Search
from moviebox_api.constants import SubjectType

async def test():
    print("Initializing Session...")
    session = Session()
    query = "The Bad Guys"
    print(f"Searching for: {query}")
    s = Search(session, query, SubjectType.ALL)
    try:
        res = await s.get_content_model()
        print(f"Items found: {len(res.items)}")
        for item in res.items:
            print(f"ID: {item.subjectId} | Type: {item.subjectType.name} | Title: {item.title} | Slug: {item.detailPath}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
