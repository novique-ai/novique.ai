-- =====================================================
-- Novique.AI Fixed-Window Social Metric Snapshots
-- =====================================================
-- Captures one immutable engagement reading per published post at each
-- reporting window. Workers write through the service-role client; admins
-- receive read-only access for dashboard reporting.
-- =====================================================

CREATE TABLE IF NOT EXISTS social_metric_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  -- "window" is a PostgreSQL reserved word; quote the identifier.
  "window" TEXT NOT NULL CHECK ("window" IN ('24h', '7d', '28d')),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metrics JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
    jsonb_typeof(metrics) = 'object'
  ),
  UNIQUE(post_id, "window")
);

CREATE INDEX IF NOT EXISTS idx_social_metric_snapshots_platform_captured
  ON social_metric_snapshots(platform, captured_at DESC);

ALTER TABLE social_metric_snapshots ENABLE ROW LEVEL SECURITY;

-- Service-role clients bypass RLS. No anon/authenticated write policies are
-- intentionally defined, keeping snapshot creation worker-only.
DROP POLICY IF EXISTS "Admins can view social metric snapshots"
  ON social_metric_snapshots;
CREATE POLICY "Admins can view social metric snapshots"
  ON social_metric_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
