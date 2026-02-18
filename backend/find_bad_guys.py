import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import Search
from moviebox_api.constants import SubjectType

async def test():
    session = Session()
    query = "The Bad Guys"
    s = Search(session, query, SubjectType.MOVIES)
    res = await s.get_content_model()
    for item in res.items:
        if "The Bad Guys" in item.title:
            print(f"TITLE: {item.title} | ID: {item.subjectId} | TYPE: {item.subjectType}")

if __name__ == "__main__":
    asyncio.run(test())
