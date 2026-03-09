import asyncio
from httpx import AsyncClient

async def main():
    async with AsyncClient(timeout=30) as client:
        query = """
        query {
            trending(limit: 5) {
                id
                title
            }
        }
        """
        try:
            r = await client.post('http://localhost:8000/graphql', json={'query': query})
            print(f"Status: {r.status_code}")
            print(f"Response: {r.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == '__main__':
    asyncio.run(main())
