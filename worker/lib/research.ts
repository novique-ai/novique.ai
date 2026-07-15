import type { FeedCandidate, SourceBundleItem } from '../types';

interface BraveResult { title?: string; url?: string; description?: string }

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchExcerpt(url: string, fallback: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'NoviqueContentWorker/1.0 (+https://novique.ai)' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return stripHtml(await response.text()).slice(0, 5000) || fallback;
  } catch (error) {
    console.warn(`WARN: source fetch failed (${url}):`, error instanceof Error ? error.message : error);
    return fallback;
  }
}

export async function buildSourceBundle(
  campaign: { title: string; topic_brief: Record<string, unknown> }
): Promise<{ sources: SourceBundleItem[]; degraded: boolean }> {
  const candidate = (campaign.topic_brief.candidate ?? {}) as Partial<FeedCandidate>;
  const braveKey = process.env.BRAVE_API_KEY?.trim();
  let raw: Array<{ title: string; url: string; publisher: string; excerpt: string }> = [];

  if (braveKey) {
    const searchUrl = new URL('https://api.search.brave.com/res/v1/web/search');
    searchUrl.searchParams.set('q', campaign.title);
    searchUrl.searchParams.set('count', '6');
    const response = await fetch(searchUrl, {
      headers: { Accept: 'application/json', 'X-Subscription-Token': braveKey },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Brave Search failed: HTTP ${response.status}`);
    const data = await response.json() as { web?: { results?: BraveResult[] } };
    raw = (data.web?.results ?? []).flatMap((result) => {
      if (!result.url || !result.title) return [];
      return [{ title: result.title, url: result.url, publisher: new URL(result.url).hostname, excerpt: result.description ?? '' }];
    });
  } else {
    console.warn('WARN: BRAVE_API_KEY is unset; research is degraded to the selected feed item.');
    if (!candidate.url) throw new Error('BRAVE_API_KEY is unset and campaign brief has no feed candidate URL');
    raw = [{
      title: candidate.title ?? campaign.title,
      url: candidate.url,
      publisher: candidate.source ?? new URL(candidate.url).hostname,
      excerpt: candidate.summary ?? '',
    }];
  }

  const sources = await Promise.all(raw.slice(0, 6).map(async (source) => ({
    url: source.url,
    title: source.title,
    publisher: source.publisher,
    accessed_at: new Date().toISOString(),
    excerpt: await fetchExcerpt(source.url, source.excerpt),
  })));
  if (sources.length === 0) throw new Error('Research returned no usable sources');
  return { sources, degraded: !braveKey };
}
