import asyncio
from httpx import AsyncClient

async def main():
    async with AsyncClient(timeout=30) as client:
        r = await client.get('http://localhost:8000/api/search?q=The Wheel of Time')
        data = r.json()
        if 'results' in data and data['results']:
            item = data['results'][0]
            print(f'Found: {item["title"]} with ID: {item["id"]}')
            # Attempt to get stream
            r2 = await client.get(f'http://localhost:8000/api/movie/{item["id"]}/stream?season=1&episode=1')
            stream = r2.json()
            print(f"Stream keys: {stream.keys() if isinstance(stream, dict) else type(stream)}")
            num_links = len(stream.get('links', [])) if isinstance(stream, dict) else 0
            print(f'Stream links count: {num_links}')
            if num_links > 0:
                print('First link:', stream['links'][0]['url'])
            else:
                print('Stream returned:', stream)
                
            r3 = await client.get(f'http://localhost:8000/api/movie/{item["id"]}/download?season=1&episode=1')
            download = r3.json()
            print(f"Download keys: {download.keys() if isinstance(download, dict) else type(download)}")
            num_links = len(download.get('links', [])) if isinstance(download, dict) else 0
            print(f'Download links count: {num_links}')
        else:
            print('No search results.')

if __name__ == '__main__':
    asyncio.run(main())
