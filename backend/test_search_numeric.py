import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import Search
from moviebox_api.constants import SubjectType

async def test():
    session = Session()
    query = "621107"
    print(f"Searching for: {query}")
    s = Search(session, query, SubjectType.ALL)
    res = await s.get_content_model()
    print(f"Items found: {len(res.items)}")
    for item in res.items:
        print(f"ID: {item.subjectId} | Title: {item.title}")

if __name__ == "__main__":
    asyncio.run(test())
