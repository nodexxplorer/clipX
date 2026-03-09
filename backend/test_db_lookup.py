import asyncio
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.database import SessionLocal, DbMovie, DbSeries
from sqlalchemy.future import select

async def main():
    async with SessionLocal() as db:
        res = await db.execute(select(DbMovie).where(DbMovie.moviebox_id == '37184'))
        mov = res.scalars().first()
        if mov:
            print(f"Found movie: {mov.title}")
        
        res2 = await db.execute(select(DbSeries).where(DbSeries.moviebox_id == '37184'))
        ser = res2.scalars().first()
        if ser:
            print(f"Found series: {ser.title}, Type: {ser.subject_type}")

if __name__ == '__main__':
    asyncio.run(main())
