"""Check if the other user account can verify various passwords."""
import asyncio
import asyncpg
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()
from app.core.auth import verify_password


async def main():
    db_url = os.getenv("DATABASE_URL")
    conn = await asyncpg.connect(db_url, statement_cache_size=0)

    row = await conn.fetchrow(
        "SELECT email, password, name, role FROM users WHERE email=$1",
        "royaldivinewill24@gmail.com",
    )
    if row:
        pwd_hash = row["password"]
        print(f"User: {row['email']}")
        print(f"Name: {row['name']}")
        print(f"Role: {row['role']}")
        print(f"Hash: {pwd_hash[:50]}...")

        # Try common passwords
        test_passwords = ["fortune@2003", "password", "123456", "admin"]
        for p in test_passwords:
            try:
                ok = verify_password(p, pwd_hash)
                print(f"  '{p}' -> {ok}")
            except Exception as e:
                print(f"  '{p}' -> ERROR: {e}")
    else:
        print("User not found")

    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
