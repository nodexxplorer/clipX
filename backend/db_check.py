import asyncio
from app.core.database import AsyncSessionLocal
from app.models.database import Movie
from sqlalchemy.future import select

async def check_movie(mid):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Movie).where(Movie.moviebox_id == str(mid)))
        movie = result.scalars().first()
        if movie:
            print(f"Found movie in DB: {movie.title} (Year: {movie.year})")
        else:
            print(f"Movie ID {mid} not found in local DB.")

if __name__ == "__main__":
    import sys
    mid = sys.argv[1] if len(sys.argv) > 1 else '621107'
    asyncio.run(check_movie(mid))
