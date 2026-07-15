import Parser from 'rss-parser';
import type { FeedCandidate } from '../types';

const parser = new Parser({ timeout: 15_000 });

function clean(value: string | undefined): string {
  return (value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchFeed(name: string, url: string): Promise<FeedCandidate[]> {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items ?? []).slice(0, 20).flatMap((item) => {
      const title = clean(item.title);
      const link = item.link?.trim();
      if (!title || !link) return [];
      const date = item.isoDate ?? item.pubDate;
      return [{
        title,
        url: link,
        published_at: date && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString() : null,
        summary: clean(item.contentSnippet ?? item.summary ?? item.content).slice(0, 1000),
        source: name,
      }];
    });
  } catch (error) {
    console.warn(`WARN: feed unavailable (${name}, ${url}):`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function fetchFeeds(feeds: Array<{ name: string; url: string }>): Promise<FeedCandidate[]> {
  const batches = await Promise.all(feeds.map((feed) => fetchFeed(feed.name, feed.url)));
  const byUrl = new Map<string, FeedCandidate>();
  for (const candidate of batches.flat()) byUrl.set(candidate.url, candidate);
  return [...byUrl.values()].sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));
}
