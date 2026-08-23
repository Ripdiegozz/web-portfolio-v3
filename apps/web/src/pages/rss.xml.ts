import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isPublished, sortPostsByDateDesc } from '../lib/blog';

export const GET: APIRoute = async (context) => {
  const posts = sortPostsByDateDesc((await getCollection('posts')).filter(isPublished));
  return rss({
    title: 'Diego blog',
    description: 'Writing about full-stack engineering.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
  });
};
