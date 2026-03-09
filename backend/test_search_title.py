import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import Search
from moviebox_api.constants import SubjectType

async def test():
    session = Session()
    query = "The Bad Guys"
    print(f"Searching for: {query}")
    s = Search(session, query, SubjectType.MOVIES)
    try:
        res = await s.get_content_model()
        print(f"Items found: {len(res.items)}")
        for item in res.items:
            print(f"ID: {item.subjectId} | Title: {item.title}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test())
