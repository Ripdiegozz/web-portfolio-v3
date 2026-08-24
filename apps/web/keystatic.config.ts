import { config, collection, fields } from '@keystatic/core';

// Local dev writes straight to the working copy; production commits to GitHub.
// The `process` guard matters at prod worker SSR (process may not exist there);
// it also keeps the config safe when the Admin island's props are serialized,
// since functions like `itemLabel` are dropped during Astro client:load prop
// serialization (see the boundary note in the admin route).
const storage =
  typeof process !== 'undefined' && process.env?.KEYSTATIC_DEV_LOCAL === '1'
    ? ({ kind: 'local' as const })
    : ({
        kind: 'github' as const,
        repo: { owner: 'Ripdiegozz', name: 'web-portfolio-v3' }, // TODO(Diego): adjust if repo differs
      });

export default config({
  storage,
  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'slug',
      path: 'apps/web/src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.text({ label: 'Title', validation: { isRequired: true } }),
        // @keystatic/core 0.6.x: fields.slug rejects a top-level `label`; only name.* props allowed.
        slug: fields.slug({ name: { label: 'Slug' } }),
        description: fields.text({ label: 'Description', multiline: true }),
        pubDate: fields.date({ label: 'Published date', validation: { isRequired: true } }),
        updatedDate: fields.date({ label: 'Updated date' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        heroImage: fields.image({
          label: 'Hero image',
          directory: 'apps/web/public/images/posts',
          publicPath: '/images/posts/',
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'New tag',
        }),
        content: fields.mdx({
          label: 'Content',
          extension: 'md',
          options: {
            bold: true,
            italic: true,
            strikethrough: true,
            code: true,
            heading: [1, 2, 3, 4, 5, 6],
            blockquote: true,
            orderedList: true,
            unorderedList: true,
            table: true,
            link: true,
            divider: true,
            codeBlock: true,
            image: {
              directory: 'apps/web/public/images/posts',
              publicPath: '/images/posts/',
            },
          },
        }),
      },
    }),
  },
});
