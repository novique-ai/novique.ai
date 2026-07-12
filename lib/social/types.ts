/**
 * Social Media Management System - TypeScript Types
 *
 * These types match the database schema in:
 * - migrations/005_social_media_system.sql
 * - migrations/006_social_platform_adapters.sql
 */

// =====================================================
// ENUMS (matching PostgreSQL enums)
// =====================================================

export type SocialPlatform = 'twitter' | 'linkedin' | 'instagram';

export type SocialAccountStatus = 'active' | 'expired' | 'revoked' | 'pending';

export type SocialPostStatus =
  | 'draft'
  | 'queued'
  | 'scheduled'
  | 'publishing'
  | 'needs_review'
  | 'published'
  | 'failed';

export type SocialSourceType = 'blog' | 'lab' | 'manual';

export type ModerationStatus =
  | 'pending'
  | 'approved'
  | 'hidden'
  | 'flagged'
  | 'spam';

/**
 * Post type classification for content rhythm
 * - auto_distributed: Blog → platforms (automated, 2-3x/week)
 * - native_insight: Platform-native thought leadership (1x/week)
 * - founder_post: Personal brand content (1x/week)
 */
export type SocialPostType =
  | 'auto_distributed'
  | 'native_insight'
  | 'founder_post';

export interface SocialMediaUploadVariant {
  url: string;
  width: number | null;
  height: number | null;
}

export interface SocialMediaUploadResult {
  fileName: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  full: SocialMediaUploadVariant;
  instagram: SocialMediaUploadVariant;
}

// =====================================================
// DATABASE ENTITIES
// =====================================================

/**
 * Connected social media platform account
 */
export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  account_name: string;
  account_handle: string | null;
  account_id: string;
  profile_image_url: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  token_scope: string | null;
  status: SocialAccountStatus;
  last_verified_at: string;
  error_message: string | null;
  rate_limit_remaining: number | null;
  rate_limit_reset_at: string | null;
  connected_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Social media post (generated or manual)
 */
export interface SocialPost {
  id: string;
  source_type: SocialSourceType;
  source_id: string | null;
  source_title: string | null;
  source_url: string | null;
  platform: SocialPlatform;
  social_account_id: string | null;
  content: string;
  media_urls: string[] | null;
  hashtags: string[] | null;
  status: SocialPostStatus;
  auto_publish: boolean;
  scheduled_at: string | null;
  published_at: string | null;
  platform_post_id: string | null;
  platform_post_url: string | null;
  error_details: SocialPostError | null;
  retry_count: number;
  last_retry_at: string | null;
  generation_metadata: GenerationMetadata | null;
  metrics: SocialPostMetrics | null;
  metrics_updated_at: string | null;
  // New fields from migration 006
  post_type: SocialPostType;
  template_id: string | null;
  // Audit
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Comment from social platform for moderation
 */
export interface SocialComment {
  id: string;
  social_post_id: string;
  platform: SocialPlatform;
  platform_comment_id: string;
  platform_parent_id: string | null;
  author_name: string | null;
  author_handle: string | null;
  author_id: string | null;
  author_profile_url: string | null;
  author_avatar_url: string | null;
  content: string;
  comment_url: string | null;
  commented_at: string | null;
  moderation_status: ModerationStatus;
  ai_analysis: CommentAIAnalysis | null;
  moderated_by: string | null;
  moderated_at: string | null;
  moderation_notes: string | null;
  auto_moderated: boolean;
  response_content: string | null;
  response_posted_at: string | null;
  response_platform_id: string | null;
  fetched_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Configuration setting
 */
export interface SocialSetting {
  id: string;
  setting_key: string;
  setting_value: unknown;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Publishing queue entry
 */
export interface SocialPostQueue {
  id: string;
  social_post_id: string;
  priority: number;
  process_after: string;
  locked_at: string | null;
  locked_by: string | null;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  created_at: string;
}

/**
 * Platform-specific template for content adaptation
 * Enables platform-native tone and formatting
 */
export interface PlatformTemplate {
  id: string;
  platform: SocialPlatform;
  template_name: string;
  display_name: string | null;
  tone: 'calm_authority' | 'sharp_opinionated' | 'visual_emotional';
  max_length: number | null;
  template_structure: string;
  hashtag_strategy: HashtagStrategy | null;
  ai_prompt_hints: string | null;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hashtag strategy configuration for templates
 */
export interface HashtagStrategy {
  max_hashtags: number;
  position: 'end' | 'inline' | 'none';
  always_include: string[];
}

/**
 * Social metadata stored with blog posts (source of truth)
 * Used by platform adapters to generate platform-specific content
 */
export interface BlogSocialMetadata {
  key_insights: string[] | null; // 3 bullet points for social
  core_takeaway: string | null; // Single sentence summary
}

/**
 * Blog post data formatted for social adapters
 * Returned by get_blog_social_data() function
 */
export interface BlogSocialData {
  slug: string;
  title: string;
  summary: string;
  url: string;
  key_insights: string[] | null;
  core_takeaway: string | null;
  tags: string[];
  published_at: string | null;
}

// =====================================================
// JSONB FIELD TYPES
// =====================================================

/**
 * Error details stored when publishing fails
 */
export interface SocialPostError {
  code: string;
  message: string;
  platform_error?: unknown;
  timestamp: string;
}

/**
 * AI generation metadata for posts
 */
export interface GenerationMetadata {
  model: string;
  prompt: string;
  tokens_used?: number;
  source_content_length?: number;
  generated_at: string;
  platform_constraints?: {
    max_length: number;
    allowed_media_types: string[];
  };
}

/**
 * Engagement metrics from platform
 */
export interface SocialPostMetrics {
  likes?: number;
  retweets?: number; // Twitter
  reposts?: number; // LinkedIn
  comments?: number;
  impressions?: number;
  reach?: number;
  engagement_rate?: number;
  clicks?: number;
  shares?: number;
  saves?: number; // Instagram
}

/**
 * AI analysis result for comment moderation
 */
export interface CommentAIAnalysis {
  toxicity_score: number; // 0-1
  spam_score: number; // 0-1
  sentiment: 'positive' | 'neutral' | 'negative';
  categories: string[]; // e.g., ['spam', 'toxic', 'off-topic']
  recommendation: 'approve' | 'hide' | 'flag' | 'respond';
  suggested_response?: string;
  analysis_model: string;
  analyzed_at: string;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

/**
 * Request to create a social post from content
 */
export interface CreateSocialPostRequest {
  source_type: SocialSourceType;
  source_id?: string;
  platforms: SocialPlatform[];
  auto_publish?: boolean;
  scheduled_at?: string;
  custom_content?: Partial<Record<SocialPlatform, string>>;
}

/**
 * Request to generate social content from blog/lab
 */
export interface GenerateSocialContentRequest {
  source_type: 'blog' | 'lab';
  source_id: string;
  platforms: SocialPlatform[];
}

/**
 * Generated content for each platform
 */
export interface GeneratedSocialContent {
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  character_count: number;
  suggested_media?: string[];
}

/**
 * Response from content generation
 */
export interface GenerateSocialContentResponse {
  source_title: string;
  source_url: string;
  posts: GeneratedSocialContent[];
}

/**
 * Request to moderate a comment
 */
export interface ModerateCommentRequest {
  comment_id: string;
  action: 'approve' | 'hide' | 'flag' | 'spam';
  notes?: string;
  response?: string; // Optional reply to post
}

/**
 * Social dashboard metrics
 */
export interface SocialDashboardMetrics {
  total_posts: number;
  posts_this_week: number;
  queued_posts: number;
  scheduled_posts: number;
  pending_comments: number;
  posts_by_platform: Partial<Record<SocialPlatform, number>>;
  posts_by_type: Partial<Record<SocialPostType, number>>; // New from 006
  active_accounts: number;
  active_templates: number; // New from 006
}

// =====================================================
// SETTINGS TYPES
// =====================================================

/**
 * All available social settings with their types
 */
export interface SocialSettings {
  default_platforms: SocialPlatform[];
  auto_publish_blog: boolean;
  auto_publish_lab: boolean;
  moderation_auto_approve: boolean;
  moderation_toxicity_threshold: number;
  moderation_spam_threshold: number;
  moderation_auto_hide_threshold: number;
}

export type SocialSettingKey = keyof SocialSettings;

// =====================================================
// PLATFORM-SPECIFIC TYPES
// =====================================================

/**
 * Platform constraints for content generation
 */
export const PLATFORM_CONSTRAINTS: Record<
  SocialPlatform,
  {
    maxLength: number;
    maxHashtags: number;
    mediaRequired: boolean;
    threadSupport: boolean;
    linkInBio: boolean;
  }
> = {
  twitter: {
    maxLength: 280,
    maxHashtags: 5,
    mediaRequired: false,
    threadSupport: true,
    linkInBio: false,
  },
  linkedin: {
    maxLength: 3000,
    maxHashtags: 10,
    mediaRequired: false,
    threadSupport: false,
    linkInBio: false,
  },
  instagram: {
    maxLength: 2200,
    maxHashtags: 30,
    mediaRequired: true,
    threadSupport: false,
    linkInBio: true, // Links don't work in captions
  },
};

/**
 * Platform display names
 */
export const PLATFORM_NAMES: Record<SocialPlatform, string> = {
  twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
};

/**
 * Post type display names
 */
export const POST_TYPE_NAMES: Record<SocialPostType, string> = {
  auto_distributed: 'Auto (Blog Distribution)',
  native_insight: 'Native Insight',
  founder_post: 'Founder Post',
};

/**
 * Template tone display names
 */
export const TONE_NAMES: Record<PlatformTemplate['tone'], string> = {
  calm_authority: 'Calm Authority',
  sharp_opinionated: 'Sharp & Opinionated',
  visual_emotional: 'Visual & Emotional',
};

/**
 * Available template variables for placeholder replacement
 */
export const TEMPLATE_VARIABLES = {
  title: '{{title}}',
  url: '{{url}}',
  short_url: '{{short_url}}',
  insight_1: '{{insight_1}}',
  insight_2: '{{insight_2}}',
  insight_3: '{{insight_3}}',
  core_takeaway: '{{core_takeaway}}',
  topic: '{{topic}}',
  emotional_hook: '{{emotional_hook}}',
  expanded_insight: '{{expanded_insight}}',
  hook: '{{hook}}',
  quote: '{{quote}}',
  context: '{{context}}',
} as const;

/**
 * Platform colors for UI
 */
export const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  twitter: '#000000', // X brand color
  linkedin: '#0A66C2',
  instagram: '#E4405F',
};

// =====================================================
// OAUTH TYPES
// =====================================================

/**
 * OAuth state stored during authentication flow
 */
export interface OAuthState {
  platform: SocialPlatform;
  redirect_uri: string;
  user_id: string;
  nonce: string;
  created_at: number;
}

/**
 * OAuth callback parameters
 */
export interface OAuthCallback {
  code: string;
  state: string;
  error?: string;
  error_description?: string;
}

/**
 * OAuth token response (normalized across platforms)
 */
export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}

export interface PublishContext {
  accountId: string;
  platformUserId?: string | null;
  accountName?: string | null;
  scopes?: string[] | null;
}

// =====================================================
// CLIENT INTERFACE
// =====================================================

/**
 * Common interface for all social media platform clients
 */
export interface SocialClient {
  platform: SocialPlatform;
  requiresPKCE: boolean;

  // Authentication
  getAuthorizationUrl(
    state: string,
    redirectUri: string,
    codeVerifier?: string
  ): string;
  exchangeCodeForToken(
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<OAuthTokenResponse>;
  refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse>;

  // Account
  getAccountInfo(accessToken: string): Promise<{
    id: string;
    name: string;
    handle: string;
    profile_image_url?: string;
  }>;
  verifyCredentials(accessToken: string): Promise<boolean>;

  // Publishing
  createPost(
    accessToken: string,
    content: string,
    mediaUrls?: string[],
    context?: PublishContext
  ): Promise<{ id: string; url: string }>;
  deletePost(accessToken: string, postId: string): Promise<void>;

  // Comments (where supported)
  getComments?(
    accessToken: string,
    postId: string
  ): Promise<
    Array<{
      id: string;
      content: string;
      author_name: string;
      author_id: string;
      created_at: string;
    }>
  >;
  hideComment?(accessToken: string, commentId: string): Promise<void>;
  replyToComment?(
    accessToken: string,
    commentId: string,
    content: string
  ): Promise<{ id: string }>;

  // Metrics (where supported)
  getPostMetrics?(
    accessToken: string,
    postId: string
  ): Promise<SocialPostMetrics>;
}

// =====================================================
// CONTENT ADAPTER TYPES
// =====================================================

/**
 * Source content for adaptation
 */
export interface ContentSource {
  type: 'blog' | 'lab';
  title: string;
  summary: string;
  content?: string; // Full content for context
  url: string;
  tags: string[];
  header_image?: string;
  // Social metadata (source of truth from blog_posts)
  key_insights?: string[]; // 3 bullet points
  core_takeaway?: string; // Single sentence summary
}

/**
 * Platform-specific content adaptation request
 */
export interface AdaptContentRequest {
  source: ContentSource;
  platform: SocialPlatform;
  template_id?: string; // Use specific template (defaults to platform default)
  post_type?: SocialPostType; // Classification for the post
  tone?: 'professional' | 'casual' | 'engaging'; // Legacy, prefer templates
  includeHashtags?: boolean;
  includeEmoji?: boolean;
}

/**
 * Adapted content result
 */
export interface AdaptedContent {
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  thread?: string[]; // For Twitter threads
  suggested_media: string[];
  character_count: number;
  within_limit: boolean;
}
