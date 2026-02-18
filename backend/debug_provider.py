import asyncio
import logging
import sys
import os

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Add app to path
sys.path.append(os.getcwd())

from app.providers.moviebox_provider import MovieboxProvider

async def test():
    provider = MovieboxProvider()
    print("Testing Trending...")
    try:
        trending = await provider.get_trending()
        print(f"Trending found {len(trending.items)} items")
        if trending.items:
            first_id = trending.items[0].subjectId
            print(f"First ID: {first_id}")
            
            print(f"Testing Detail for {first_id}...")
            details = await provider.get_details(first_id)
            if details:
                print(f"Details Title: {details.resData.subject.title}")
            else:
                print("Details returned None")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
