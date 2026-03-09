"""Create admin user using the pooler connection URL from DATABASE_URL."""
import asyncio
import asyncpg
import uuid
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.core.auth import get_password_hash


async def main():
    db_url = os.getenv("DATABASE_URL")
    # asyncpg needs postgresql:// (not postgresql+asyncpg://)
    if "+asyncpg" in db_url:
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(db_url, statement_cache_size=0)

    email = "mfonidivinewill@gmail.com"
    name = "Mfon Admin"
    password = "fortune@2003"
    hashed = get_password_hash(password)

    row = await conn.fetchrow("SELECT id, role FROM users WHERE email=$1", email)
    if row:
        await conn.execute(
            "UPDATE users SET role=$1, name=$2, password=$3 WHERE email=$4",
            "admin", name, hashed, email,
        )
        uid = row["id"]
        print(f"Updated existing user to admin (id={uid})")
    else:
        uid = uuid.uuid4()
        await conn.execute(
            "INSERT INTO users(id, email, password, name, role, preferences) VALUES($1,$2,$3,$4,$5,$6::jsonb)",
            uid, email, hashed, name, "admin", "{}",
        )
        print(f"Created new admin user (id={uid})")

    print(f"  Email: {email}")
    print(f"  Name:  {name}")
    print(f"  Role:  admin")

    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
