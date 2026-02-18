import asyncio
import sys
import os

# Add the project root to sys.path to import app
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'app')))
sys.path.append(os.getcwd())

from app.services.movie_service import movie_service

async def test_trending():
    try:
        print("Fetching trending content...")
        resp = await movie_service.get_trending()
        print(f"Status: Success")
        print(f"Found {len(resp.results)} items")
        for item in resp.results[:5]:
            print(f"- {item.title} ({item.year})")
    except Exception as e:
        print(f"Error fetching trending: {e}")

async def test_search():
    try:
        print("\nSearching for 'Inception'...")
        resp = await movie_service.search_content("Inception")
        print(f"Status: Success")
        print(f"Found {len(resp.results)} items")
        for item in resp.results[:5]:
            print(f"- {item.title} ({item.year})")
    except Exception as e:
        print(f"Error searching: {e}")

if __name__ == "__main__":
    asyncio.run(test_trending())
    asyncio.run(test_search())
