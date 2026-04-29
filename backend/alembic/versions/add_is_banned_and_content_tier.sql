-- Migration: Add is_banned to users, content_tier to movies and series
-- Run this against your PostgreSQL database before deploying.

-- 1. User ban column (Issue #5)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- 2. Content tier columns for paywall enforcement (Issue #4)
ALTER TABLE movies ADD COLUMN IF NOT EXISTS content_tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE series ADD COLUMN IF NOT EXISTS content_tier VARCHAR(20) DEFAULT 'free';

-- Index for quick lookups of banned users
CREATE INDEX IF NOT EXISTS ix_users_is_banned ON users (is_banned) WHERE is_banned = TRUE;
