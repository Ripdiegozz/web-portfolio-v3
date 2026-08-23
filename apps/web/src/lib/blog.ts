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
