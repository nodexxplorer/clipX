import asyncio
from httpx import AsyncClient

async def main():
    async with AsyncClient(timeout=30) as client:
        r = await client.get('http://localhost:8000/api/movie/search?q=Avatar')
        data = r.json()
        if 'results' in data and data['results']:
            item = data['results'][0]
            print(f'Found: {item["title"]} with ID: {item["id"]}')
            # Attempt to get stream
            r2 = await client.get(f'http://localhost:8000/api/movie/{item["id"]}/stream?season=0&episode=1')
            stream = r2.json()
            print(f"Stream keys: {stream.keys()}")
            num_links = len(stream.get('links', []))
            print(f'Stream links count: {num_links}')
            if num_links > 0:
                print('First link:', stream['links'][0]['url'])
            else:
                print('Stream returned:', stream)
        else:
            print('No search results.')

if __name__ == '__main__':
    asyncio.run(main())
