import type { SocialPlatform } from './types';

export interface UtmOptions {
  source: SocialPlatform;
  campaignSlug: string;
  content: string;
}

const NOVIQUE_URL = /https?:\/\/(?:www\.)?novique\.ai(?:\/[^\s<>]*)?/gi;
const TRAILING_PUNCTUATION = /[.,;:!?"'’”\)\]\}]+$/;

function stableValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Add stable organic-social attribution to outbound Novique links. */
export function applyUtm(text: string, options: UtmOptions): string {
  const source = stableValue(options.source);
  const campaign = stableValue(options.campaignSlug);
  const content = `${source}_${stableValue(options.content)}`;

  return text.replace(NOVIQUE_URL, (match) => {
    const trailing = match.match(TRAILING_PUNCTUATION)?.[0] || '';
    const rawUrl = trailing ? match.slice(0, -trailing.length) : match;

    try {
      const url = new URL(rawUrl);
      if (url.searchParams.has('utm_source')) return match;

      url.searchParams.set('utm_source', source);
      url.searchParams.set('utm_medium', 'organic_social');
      url.searchParams.set('utm_campaign', campaign);
      url.searchParams.set('utm_content', content);
      return `${url.toString()}${trailing}`;
    } catch {
      return match;
    }
  });
}
