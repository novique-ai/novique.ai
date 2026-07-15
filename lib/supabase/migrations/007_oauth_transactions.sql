-- =====================================================
-- Novique.AI Social OAuth Transactions
-- =====================================================
-- Persists short-lived OAuth state and PKCE verifiers so
-- callbacks remain valid across serverless instances.
-- Service-role access only; no user-facing RLS policies.
-- =====================================================

CREATE TABLE IF NOT EXISTS social_oauth_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  state TEXT UNIQUE NOT NULL,
  code_verifier TEXT,
  redirect_uri TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_social_oauth_transactions_state
  ON social_oauth_transactions(state);

ALTER TABLE social_oauth_transactions ENABLE ROW LEVEL SECURITY;

-- No anon or authenticated policies are intentionally defined.
-- OAuth routes access this table through the service-role client.
