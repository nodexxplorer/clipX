import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import Search
from moviebox_api.constants import SubjectType

async def test():
    session = Session()
    # Testing with '621107' which is likely the ID for 'The Bad Guys'
    s = Search(session, '621107', SubjectType.ALL)
    res = await s.get_content_model()
    print(f"Items found with ID '621107': {len(res.items)}")
    for item in res.items:
        print(f"ID: {item.subjectId}, Title: {item.title}")

    # Also test with a known title search to see if ID is correct
    s2 = Search(session, 'The Bad Guys', SubjectType.MOVIES)
    res2 = await s2.get_content_model()
    print(f"\nItems found with title 'The Bad Guys': {len(res2.items)}")
    for item in res2.items:
        print(f"ID: {item.subjectId}, Title: {item.title}")

if __name__ == "__main__":
    asyncio.run(test())
