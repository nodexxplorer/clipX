"""
Safe database migration script.
Adds missing columns and tables without breaking existing data.
Run with: python -m app.core.migrate
"""

import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

MIGRATIONS = [
    # Add moviebox_id to reviews (for movie-specific reviews)
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'reviews' AND column_name = 'moviebox_id'
        ) THEN
            ALTER TABLE reviews ADD COLUMN moviebox_id VARCHAR NULL;
            CREATE INDEX IF NOT EXISTS ix_reviews_moviebox_id ON reviews (moviebox_id);
            RAISE NOTICE 'Added moviebox_id to reviews';
        ELSE
            RAISE NOTICE 'moviebox_id already exists on reviews';
        END IF;
    END $$;
    """,

    # Add email_verified to users
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'email_verified'
        ) THEN
            ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Added email_verified to users';
        ELSE
            RAISE NOTICE 'email_verified already exists on users';
        END IF;
    END $$;
    """,

    # Add last_active to users
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'last_active'
        ) THEN
            ALTER TABLE users ADD COLUMN last_active TIMESTAMP DEFAULT NOW();
            RAISE NOTICE 'Added last_active to users';
        ELSE
            RAISE NOTICE 'last_active already exists on users';
        END IF;
    END $$;
    """,

    # Add subscription tier to users
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'subscription_tier'
        ) THEN
            ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free';
            RAISE NOTICE 'Added subscription_tier to users';
        ELSE
            RAISE NOTICE 'subscription_tier already exists on users';
        END IF;
    END $$;
    """,

    # Add subscription_expires_at to users
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'subscription_expires_at'
        ) THEN
            ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMP NULL;
            RAISE NOTICE 'Added subscription_expires_at to users';
        ELSE
            RAISE NOTICE 'subscription_expires_at already exists on users';
        END IF;
    END $$;
    """,

    # Add paystack_customer_code to users
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'paystack_customer_code'
        ) THEN
            ALTER TABLE users ADD COLUMN paystack_customer_code VARCHAR(255) NULL;
            RAISE NOTICE 'Added paystack_customer_code to users';
        ELSE
            RAISE NOTICE 'paystack_customer_code already exists on users';
        END IF;
    END $$;
    """,

    # Add referral_count to users
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'referral_count'
        ) THEN
            ALTER TABLE users ADD COLUMN referral_count INTEGER DEFAULT 0;
            RAISE NOTICE 'Added referral_count to users';
        ELSE
            RAISE NOTICE 'referral_count already exists on users';
        END IF;
    END $$;
    """,

    # Create subscriptions table
    """
    CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan VARCHAR(20) NOT NULL DEFAULT 'free',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        paystack_subscription_code VARCHAR(255),
        paystack_email_token VARCHAR(255),
        amount INTEGER DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'NGN',
        started_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_subscriptions_user_id ON subscriptions (user_id);
    """,

    # Create payment_history table
    """
    CREATE TABLE IF NOT EXISTS payment_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
        paystack_reference VARCHAR(255) UNIQUE,
        amount INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'NGN',
        status VARCHAR(20) DEFAULT 'pending',
        plan VARCHAR(20),
        payment_method VARCHAR(100),
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_payment_history_user_id ON payment_history (user_id);
    """,

    # Add grace_period_end to users
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'grace_period_end'
        ) THEN
            ALTER TABLE users ADD COLUMN grace_period_end TIMESTAMP NULL;
            RAISE NOTICE 'Added grace_period_end to users';
        ELSE
            RAISE NOTICE 'grace_period_end already exists on users';
        END IF;
    END $$;
    """,

    # Create refresh_tokens table for JWT rotation
    """
    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(512) NOT NULL,
        family_id UUID NOT NULL,
        is_revoked BOOLEAN DEFAULT FALSE,
        device_info VARCHAR(500),
        ip_address VARCHAR(50),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id ON refresh_tokens (user_id);
    CREATE INDEX IF NOT EXISTS ix_refresh_tokens_token_hash ON refresh_tokens (token_hash);
    CREATE INDEX IF NOT EXISTS ix_refresh_tokens_family ON refresh_tokens (family_id);
    """,
]


async def run_migrations():
    from app.core.database import engine
    from sqlalchemy import text

    print("🔄 Running database migrations...")
    async with engine.begin() as conn:
        for i, sql in enumerate(MIGRATIONS):
            try:
                await conn.execute(text(sql))
                print(f"  ✅ Migration {i + 1}/{len(MIGRATIONS)} applied")
            except Exception as e:
                print(f"  ⚠️  Migration {i + 1}/{len(MIGRATIONS)} skipped: {e}")

    print("✅ All migrations complete!")


if __name__ == "__main__":
    asyncio.run(run_migrations())
