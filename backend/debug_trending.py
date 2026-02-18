import asyncio
from moviebox_api.requests import Session
from moviebox_api.core import Trending

async def test():
    try:
        session = Session()
        trending = Trending(session)
        print("Fetching trending...")
        # Use a timeout if possible, or just wait
        results = await asyncio.wait_for(trending.get_content_model(), timeout=10.0)
        print(f"Found {len(results.items)} items")
        for item in results.items[:3]:
            print(f"- {item.title} (ID: {item.subjectId})")
    except asyncio.TimeoutError:
        print("Timeout reached!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
