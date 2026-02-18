import asyncio
from app.core.database import AsyncSessionLocal
from app.models.database import Movie
from sqlalchemy.future import select

async def test():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Movie))
        movies = res.scalars().all()
        print(f"Total movies in database: {len(movies)}")
        for m in movies:
            print(f"UUID: {m.id} | Moviebox ID: {m.moviebox_id} | Title: {m.title}")

if __name__ == "__main__":
    asyncio.run(test())
