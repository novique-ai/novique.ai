/**
 * @deprecated Import from `@/lib/ai/llm` instead.
 * Text generation uses OpenRouter open-weight models; no Anthropic.
 */
export {
  generateWithLLM as generateWithClaude,
  generateWithLLM,
  generateBlogOutline,
  generateBlogContent,
  generateSEOMetadata,
  generateSummary,
  LLM_UTILITY_MODEL,
  LLM_WRITER_MODEL,
} from './llm'
