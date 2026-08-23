import { config, collection, fields } from '@keystatic/core';

// Local dev writes straight to the working copy; production commits to GitHub.
// The `process` guard keeps this module safe inside the client bundle (the
// Admin island imports it) where `process` does not exist.
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
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.text({ label: 'Title', validation: { isRequired: true } }),
        slug: fields.slug({ name: { label: 'Slug' } }),
        description: fields.text({ label: 'Description', multiline: true }),
        pubDate: fields.date({ label: 'Published date', validation: { isRequired: true } }),
        updatedDate: fields.date({ label: 'Updated date' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        heroImage: fields.image({
          label: 'Hero image',
          directory: 'public/images/posts',
          publicPath: '/images/posts/',
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'New tag',
        }),
        content: fields.document({ label: 'Content' }),
      },
    }),
  },
});
