"""Debug login issues: check user records and verify passwords."""
import asyncio
import asyncpg
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()
from app.core.auth import get_password_hash, verify_password


async def main():
    db_url = os.getenv("DATABASE_URL")
    conn = await asyncpg.connect(db_url, statement_cache_size=0)

    rows = await conn.fetch("SELECT email, password, role FROM users LIMIT 10")
    print(f"\n=== {len(rows)} user(s) found ===")
    for r in rows:
        email = r["email"]
        pwd = r["password"]
        role = r["role"]
        has_hash = bool(pwd)
        prefix = pwd[:40] if pwd else "NONE"
        print(f"  {email} | role={role} | has_pwd={has_hash} | prefix={prefix}")

    # Test admin login
    admin = await conn.fetchrow(
        "SELECT password FROM users WHERE email=$1", "mfonidivinewill@gmail.com"
    )
    if admin and admin["password"]:
        try:
            ok = verify_password("fortune@2003", admin["password"])
            print(f"\nAdmin verify_password result: {ok}")
        except Exception as e:
            print(f"\nAdmin verify_password ERROR: {e}")
    else:
        print("\nAdmin user not found or has no password!")

    # Test a fresh hash and verify cycle
    test_hash = get_password_hash("testpassword123")
    test_ok = verify_password("testpassword123", test_hash)
    print(f"\nFresh hash/verify sanity check: {test_ok}")

    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
