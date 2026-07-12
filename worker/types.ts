export interface WorkerConfig {
  feeds: Array<{ name: string; url: string }>;
  articles_per_week: number;
  monthly_token_budget_usd: number;
  models: {
    utility: ModelConfig;
    writer: ModelConfig;
  };
}

export interface ModelConfig {
  id: string;
  input_cost_per_million_usd: number;
  output_cost_per_million_usd: number;
}

export interface FeedCandidate {
  title: string;
  url: string;
  published_at: string | null;
  summary: string;
  source: string;
  scores?: CandidateScores;
  score?: number;
  rationale?: string;
}

export interface CandidateScores {
  audience_pain: number;
  novique_authority: number;
  evidence: number;
  business_fit: number;
  timing: number;
}

export interface UsageRecord {
  timestamp: string;
  campaign_id: string | null;
  stage: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}

export interface SourceBundleItem {
  url: string;
  title: string;
  publisher: string;
  accessed_at: string;
  excerpt: string;
}
