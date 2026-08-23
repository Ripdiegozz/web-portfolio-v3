import type { Locale } from '../i18n/types';

interface EntryLike {
  data: { draft?: boolean; pubDate: Date };
}

/** Drafts stay visible in dev previews, filtered out of PROD builds. */
export function isPublished(entry: EntryLike): boolean {
  return !(import.meta.env.PROD && entry.data.draft === true);
}

export function sortPostsByDateDesc<T extends EntryLike>(entries: T[]): T[] {
  return [...entries].sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
  );
}

/**
 * Calculates estimated reading time in minutes based on content word count.
 * Strips markdown code blocks, links, and tags before counting.
 * Minimum return value is 1 minute.
 */
export function getReadingTime(content: string, wordsPerMinute = 200): number {
  if (!content || typeof content !== 'string') return 1;

  const cleanText = content
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/`.*?`/g, '') // remove inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // replace links with anchor text
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/#+\s/g, '') // remove headers
    .replace(/[*_~]/g, '') // remove bold/italic/strikethrough markers
    .trim();

  const words = cleanText.split(/\s+/).filter(Boolean).length;
  if (words === 0) return 1;

  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Formats a publication date using UTC to avoid runner timezone shifts.
 */
export function formatBlogDate(date: Date, locale: Locale = 'en'): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

  return formatter.format(date);
}
