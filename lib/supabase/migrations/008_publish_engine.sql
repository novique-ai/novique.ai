-- =====================================================
-- Novique.AI Social Publish Engine
-- =====================================================
-- Adds durable publish-attempt records for idempotency and
-- the review state used when an external result is ambiguous.
-- Service-role access only; no user-facing RLS policies.
-- =====================================================

ALTER TYPE social_post_status ADD VALUE IF NOT EXISTS 'needs_review';

CREATE TABLE IF NOT EXISTS social_publish_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES social_accounts(id),
  idempotency_key TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('started', 'succeeded', 'failed', 'unknown')
  ),
  platform_post_id TEXT,
  platform_post_url TEXT,
  error_code TEXT,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_social_publish_attempts_post
  ON social_publish_attempts(post_id);

CREATE INDEX IF NOT EXISTS idx_social_queue_process_lock
  ON social_post_queue(process_after, locked_at);

ALTER TABLE social_publish_attempts ENABLE ROW LEVEL SECURITY;

-- No anon or authenticated policies are intentionally defined.
-- Publish executors access this table through the service-role client.
