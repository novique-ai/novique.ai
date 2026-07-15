-- =====================================================
-- Novique.AI Content Campaigns and Approval Gates
-- =====================================================
-- Adds the durable content supply chain above blog_posts and social_posts.
-- Campaign data is service-role-only. Approval decisions are visible and
-- editable by admins; background workers retain full service-role access.
-- =====================================================

CREATE TABLE IF NOT EXISTS content_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN (
      'proposed',
      'approved',
      'researching',
      'drafted',
      'article_published',
      'complete',
      'abandoned'
    )
  ),
  week_of DATE NOT NULL,
  topic_brief JSONB NOT NULL DEFAULT '{}'::JSONB,
  source_bundle JSONB NOT NULL DEFAULT '[]'::JSONB CHECK (
    jsonb_typeof(source_bundle) = 'array'
  ),
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN content_campaigns.topic_brief IS
  'Campaign brief containing audience, angle, rationale, and score.';
COMMENT ON COLUMN content_campaigns.source_bundle IS
  'Array of sources containing url, title, publisher, accessed_at, and excerpt.';
COMMENT ON COLUMN content_campaigns.blog_post_id IS
  'Canonical article. UUID matches the existing social_posts.source_id convention for blog_posts.';

CREATE INDEX IF NOT EXISTS idx_content_campaigns_status_week
  ON content_campaigns(status, week_of);
CREATE INDEX IF NOT EXISTS idx_content_campaigns_blog_post
  ON content_campaigns(blog_post_id)
  WHERE blog_post_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS campaign_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES content_campaigns(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (
    kind IN ('brief', 'outline', 'draft', 'editorial', 'fact_check', 'final')
  ),
  revision INTEGER NOT NULL CHECK (revision > 0),
  content_md TEXT NOT NULL,
  model TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, kind, revision)
);

CREATE INDEX IF NOT EXISTS idx_campaign_artifacts_campaign
  ON campaign_artifacts(campaign_id, kind, revision DESC);

CREATE TABLE IF NOT EXISTS content_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL CHECK (
    subject_type IN (
      'weekly_plan',
      'article',
      'template_probation',
      'image_style',
      'post_review'
    )
  ),
  subject_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected')
  ),
  summary TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_content_approvals_status_type
  ON content_approvals(status, subject_type);

CREATE TABLE IF NOT EXISTS template_probation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  template_key TEXT NOT NULL,
  clean_publishes INTEGER NOT NULL DEFAULT 0 CHECK (clean_publishes >= 0),
  required INTEGER NOT NULL DEFAULT 5 CHECK (required > 0),
  status TEXT NOT NULL DEFAULT 'probation' CHECK (
    status IN ('probation', 'trusted', 'suspended')
  ),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(platform, template_key)
);

ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS campaign_id UUID
  REFERENCES content_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_social_posts_campaign
  ON social_posts(campaign_id)
  WHERE campaign_id IS NOT NULL;

DROP TRIGGER IF EXISTS trigger_content_campaigns_updated ON content_campaigns;
CREATE TRIGGER trigger_content_campaigns_updated
  BEFORE UPDATE ON content_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

DROP TRIGGER IF EXISTS trigger_template_probation_updated ON template_probation;
CREATE TRIGGER trigger_template_probation_updated
  BEFORE UPDATE ON template_probation
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

ALTER TABLE content_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_probation ENABLE ROW LEVEL SECURITY;

-- content_campaigns, campaign_artifacts, and template_probation intentionally
-- have no anon/authenticated policies. Workers use the service-role client.

DROP POLICY IF EXISTS "Admins can view content approvals" ON content_approvals;
CREATE POLICY "Admins can view content approvals"
  ON content_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can decide content approvals" ON content_approvals;
CREATE POLICY "Admins can decide content approvals"
  ON content_approvals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Atomic service-role helper for publish-success bookkeeping. The UPSERT
-- increments clean publishes and promotes probation only after the threshold.
CREATE OR REPLACE FUNCTION record_template_clean_publish(
  p_platform TEXT,
  p_template_key TEXT
)
RETURNS template_probation
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  probation template_probation;
BEGIN
  INSERT INTO template_probation (
    platform,
    template_key,
    clean_publishes,
    status
  ) VALUES (
    p_platform,
    p_template_key,
    1,
    'probation'
  )
  ON CONFLICT (platform, template_key) DO UPDATE SET
    clean_publishes = template_probation.clean_publishes + 1,
    status = CASE
      WHEN template_probation.status = 'suspended' THEN 'suspended'
      WHEN template_probation.clean_publishes + 1 >= template_probation.required
        THEN 'trusted'
      ELSE template_probation.status
    END,
    updated_at = NOW()
  RETURNING * INTO probation;

  IF probation.status = 'probation'
    AND probation.clean_publishes >= probation.required THEN
    UPDATE template_probation
    SET status = 'trusted', updated_at = NOW()
    WHERE id = probation.id
    RETURNING * INTO probation;
  END IF;

  RETURN probation;
END;
$$;

REVOKE ALL ON FUNCTION record_template_clean_publish(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_template_clean_publish(TEXT, TEXT) TO service_role;
