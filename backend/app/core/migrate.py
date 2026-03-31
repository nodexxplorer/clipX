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

    # Login activity / security logs table
    """
    CREATE TABLE IF NOT EXISTS login_activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL DEFAULT 'login',
        device_info VARCHAR(500),
        ip_address VARCHAR(50),
        location VARCHAR(255),
        user_agent VARCHAR(1000),
        success BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_login_activity_user_id ON login_activity (user_id);
    CREATE INDEX IF NOT EXISTS ix_login_activity_created ON login_activity (created_at DESC);
    """,

    # 2FA columns on users — run manually in SQL editor:
    # ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64) NULL;
    # ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;
    # ALTER TABLE users ADD COLUMN IF NOT EXISTS backup_codes JSONB DEFAULT '[]'::jsonb;

    # Promo/coupon codes table
    """
    CREATE TABLE IF NOT EXISTS promo_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_percent INTEGER DEFAULT 0,
        discount_months INTEGER DEFAULT 1,
        plan VARCHAR(20),
        max_uses INTEGER DEFAULT 100,
        current_uses INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_promo_codes_code ON promo_codes (code);
    """,

    # Track which users applied which promo
    """
    CREATE TABLE IF NOT EXISTS applied_promos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
        applied_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, promo_code_id)
    );
    """,

    # ═══════════════════════════════════════════════════════════
    # V2 Tables — Social, Family Plan, Watch Party, Notifications
    # ═══════════════════════════════════════════════════════════

    # Review likes (like/dislike)
    """
    CREATE TABLE IF NOT EXISTS review_likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        like_type VARCHAR(10) NOT NULL CHECK (like_type IN ('like', 'dislike')),
        created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ix_review_likes_user_review ON review_likes (user_id, review_id);
    """,

    # Review reports (moderation)
    """
    CREATE TABLE IF NOT EXISTS review_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        reason VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ix_review_reports_user_review ON review_reports (user_id, review_id);
    """,

    # Watch party rooms
    """
    CREATE TABLE IF NOT EXISTS watch_party_rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        moviebox_id VARCHAR(255) NOT NULL,
        content_type VARCHAR(50) DEFAULT 'movie',
        room_code VARCHAR(20) NOT NULL UNIQUE,
        status VARCHAR(20) DEFAULT 'active',
        max_participants INTEGER DEFAULT 10,
        current_time INTEGER DEFAULT 0,
        is_playing BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP NULL
    );
    CREATE INDEX IF NOT EXISTS ix_wp_room_code ON watch_party_rooms (room_code);
    """,

    # Watch party participants
    """
    CREATE TABLE IF NOT EXISTS watch_party_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID NOT NULL REFERENCES watch_party_rooms(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ix_wp_participant_room_user ON watch_party_participants (room_id, user_id);
    """,

    # Family plans
    """
    CREATE TABLE IF NOT EXISTS family_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        member_slots INTEGER DEFAULT 5,
        invite_code VARCHAR(20) NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_family_plans_invite_code ON family_plans (invite_code);
    """,

    # Family members
    """
    CREATE TABLE IF NOT EXISTS family_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        family_plan_id UUID NOT NULL REFERENCES family_plans(id) ON DELETE CASCADE,
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ix_family_member_plan_user ON family_members (family_plan_id, user_id);
    """,

    # Family invites
    """
    CREATE TABLE IF NOT EXISTS family_invites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        family_plan_id UUID NOT NULL REFERENCES family_plans(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(64) NOT NULL UNIQUE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NULL
    );
    CREATE INDEX IF NOT EXISTS ix_family_invites_token ON family_invites (token);
    """,

    # User layout preferences (drag-and-drop row ordering)
    """
    CREATE TABLE IF NOT EXISTS user_layout_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        layout_order JSONB DEFAULT '[]'::jsonb,
        updated_at TIMESTAMP DEFAULT NOW()
    );
    """,

    # Push notification subscriptions (FCM tokens)
    """
    CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        fcm_token VARCHAR(500) NOT NULL,
        device_type VARCHAR(20) DEFAULT 'web',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ix_push_sub_user_token ON push_subscriptions (user_id, fcm_token);
    """,

    # Yearly stats (Wrapped-style)
    """
    CREATE TABLE IF NOT EXISTS yearly_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        total_minutes INTEGER DEFAULT 0,
        total_titles INTEGER DEFAULT 0,
        top_genres JSONB DEFAULT '[]'::jsonb,
        top_actors JSONB DEFAULT '[]'::jsonb,
        favorite_movies JSONB DEFAULT '[]'::jsonb,
        longest_binge INTEGER DEFAULT 0,
        data JSONB DEFAULT '{}'::jsonb,
        generated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ix_yearly_stats_user_year ON yearly_stats (user_id, year);
    """,
]


async def run_migrations():
    from app.core.database import engine
    from sqlalchemy import text

    print("🔄 Running database migrations...")
    for i, sql in enumerate(MIGRATIONS):
        try:
            async with engine.begin() as conn:
                # asyncpg does not allow multiple statements per execute().
                # Handle `DO $$...` blocks as single executions, otherwise split on `;`
                if "DO $$" in sql:
                    await conn.execute(text(sql))
                else:
                    parts = [p.strip() for p in sql.split(';') if p.strip()]
                    for part in parts:
                        await conn.execute(text(part))

            print(f"  ✅ Migration {i + 1}/{len(MIGRATIONS)} applied")
        except Exception as e:
            print(f"  ⚠️  Migration {i + 1}/{len(MIGRATIONS)} skipped: {e}")

    print("✅ All migrations complete!")


if __name__ == "__main__":
    asyncio.run(run_migrations())
