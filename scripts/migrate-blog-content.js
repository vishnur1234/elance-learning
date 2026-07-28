/**
 * Migration: wire up the Blog page's hero chrome for full EmDash CMS editing.
 *
 * src/pages/blog.astro now fetches its hero + "Featured On" chrome copy from
 * the shared 'pages' collection (slug 'blog') via a dedicated
 * getEmDashEntry("pages", "blog") call — separate from its existing
 * getEmDashCollection('blog', ...) post-list query, which is untouched. This
 * script pushes the hero-chrome field definitions + current literal values
 * into the LIVE EmDash CMS so they become genuinely editable in the CMS
 * admin, using EmDash's official REST client with "dev bypass" auth (only
 * valid against localhost) — no raw SQL, no direct DB access.
 *
 * This script:
 *   1. Creates the 4 new fields (hero_title, hero_subtitle, featured_title,
 *      featured_subtitle) on the 'pages' collection — skipping any that
 *      already exist (featured_title/featured_subtitle are shared with other
 *      pages that also render <FeaturedOn>).
 *   2. Creates (or updates, if already present) the 'pages' row with slug
 *      'blog', status 'published', setting its data to match blog.astro's
 *      current literal fallbacks exactly.
 *
 * Run with: node scripts/migrate-blog-content.js
 */

import { EmDashClient } from 'emdash/client';

const client = new EmDashClient({ baseUrl: 'http://localhost:4321', devBypass: true });

// [slug, label, type]
const NEW_FIELDS = [
  ['hero_title', 'Hero Title', 'string'],
  ['hero_subtitle', 'Hero Subtitle', 'text'],
  ['featured_title', 'Featured On Title', 'string'],
  ['featured_subtitle', 'Featured On Subtitle', 'text'],
];

// Values to set on the 'blog' pages row — copied verbatim from the literal
// fallbacks in src/pages/blog.astro so the visible copy is byte-identical
// before and after this migration.
const BLOG_PAGE_VALUES = {
  hero_title: 'Blog',
  hero_subtitle:
    'Expand your knowledge with our informative blogs,<br />offering valuable insights to support your growth<br />and clear your doubts.',
  featured_title: 'We\'re <span class="text-blue">Featured</span> On',
  featured_subtitle:
    'Recognized by leading media houses for our commitment to quality education and student success.',
};

async function main() {
  console.log('Connecting to EmDash CMS at http://localhost:4321 (dev bypass auth)...');

  const pagesCollection = await client.collection('pages');
  const existingFieldSlugs = new Set(pagesCollection.fields.map((f) => f.slug));
  console.log(`'pages' collection currently has ${existingFieldSlugs.size} field(s).`);

  // ---------- 1. Create any missing fields ----------
  let addedFields = 0;
  for (const [slug, label, type] of NEW_FIELDS) {
    if (existingFieldSlugs.has(slug)) {
      console.log(`Field '${slug}' already exists — skipping.`);
      continue;
    }
    await client.createField('pages', { slug, type, label });
    console.log(`Created field '${slug}' (${type}) — "${label}".`);
    addedFields += 1;
  }
  console.log(`Added ${addedFields} new field(s) to the 'pages' collection.`);

  // ---------- 2. Create or update the 'blog' row ----------
  const { items } = await client.list('pages', { limit: 100 });
  const existing = items.find((i) => i.slug === 'blog');

  if (existing) {
    await client.update('pages', existing.id, { data: BLOG_PAGE_VALUES });
    await client.publish('pages', existing.id);
    console.log(`Updated existing 'blog' row (id: ${existing.id}) with current page content.`);
  } else {
    const created = await client.create('pages', {
      slug: 'blog',
      data: { title: 'Blog Page', ...BLOG_PAGE_VALUES },
    });
    await client.publish('pages', created.id);
    console.log("Created and published new 'blog' row with current page content.");
  }

  console.log('\n✅ Done!');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
