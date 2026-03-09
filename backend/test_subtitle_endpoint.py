import asyncio
import os
import sys
import httpx

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def main():
    async with httpx.AsyncClient() as client:
        # Request the streaming details endpoint for our movie to see if it grabs subtitles
        res = await client.get('http://localhost:8000/api/movie/7053971046189646888/stream?season=1&episode=1')
        print(res.status_code)
        data = res.json()
        print(data.keys())
        if 'subtitles' in data:
            for sub in data['subtitles']:
                print(sub)

if __name__ == "__main__":
    asyncio.run(main())
