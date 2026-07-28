/**
 * Migration: wire up the Contact page for full EmDash CMS editing.
 *
 * src/pages/contact.astro now fetches its copy from the shared 'pages'
 * collection (slug 'contact') via getEmDashEntry, with byte-identical
 * literal fallbacks for every field it reads. This script pushes those same
 * field definitions + current literal values into the LIVE EmDash CMS so
 * they become genuinely editable in the CMS admin, using EmDash's official
 * REST client with "dev bypass" auth (only valid against localhost) — no
 * raw SQL, no direct DB access.
 *
 * This script:
 *   1. Creates the 15 new fields (header_title, header_desc, left_title,
 *      address_1/2/3, contact_email, contact_phone, maps_title,
 *      map_1_label/url, map_2_label/url, featured_title, featured_subtitle)
 *      on the 'pages' collection — skipping any that already exist (e.g.
 *      featured_title/featured_subtitle are shared with other pages that
 *      also render <FeaturedOn>).
 *   2. Creates (or updates, if already present) the 'pages' row with slug
 *      'contact', status 'published', setting its data to match
 *      contact.astro's current literal fallbacks exactly.
 *
 * Run with: node scripts/migrate-contact-content.js
 */

import { EmDashClient } from 'emdash/client';

const client = new EmDashClient({ baseUrl: 'http://localhost:4321', devBypass: true });

// [slug, label, type]
const NEW_FIELDS = [
  ['header_title', 'Header Title', 'string'],
  ['header_desc', 'Header Description', 'text'],
  ['left_title', 'Left Panel Title', 'string'],
  ['address_1', 'Address 1', 'text'],
  ['address_2', 'Address 2', 'text'],
  ['address_3', 'Address 3', 'text'],
  ['contact_email', 'Contact Email', 'string'],
  ['contact_phone', 'Contact Phone', 'string'],
  ['maps_title', 'Maps Section Title', 'string'],
  ['map_1_label', 'Map 1 Label', 'string'],
  ['map_1_url', 'Map 1 Embed URL', 'string'],
  ['map_2_label', 'Map 2 Label', 'string'],
  ['map_2_url', 'Map 2 Embed URL', 'string'],
  ['featured_title', 'Featured On Title', 'string'],
  ['featured_subtitle', 'Featured On Subtitle', 'text'],
];

// Values to set on the 'contact' pages row — copied verbatim from the
// literal fallbacks in src/pages/contact.astro so the visible copy is
// byte-identical before and after this migration.
const CONTACT_PAGE_VALUES = {
  header_title: 'Contact <span class="contact-header-blue">Us</span>',
  header_desc:
    'Take a career step into the dynamic world of finance and explore the limitless professional opportunities of ACCA, CA, and CMA. Act today and accelerate your career to new heights.',
  left_title: 'Explore Empowering Courses, Inquire for a Better Tomorrow',
  address_1:
    '2nd Floor, Metro Magna Building, Mavoor Rd, Parayancheri, Puthiyara, Kozhikode, Kerala 673016',
  address_2:
    'Primero Plaza, A K Seshadri Rd, near Maharajas College Ground, Shenoys, Kochi, Ernakulam, Kerala 682011',
  address_3: 'Elance Knowledge Tower, Palazhi Road, Pottammal, Kozhikode, Kerala 673016',
  contact_email: 'info@Elancelearning.com',
  contact_phone: '+91 98950 97070',
  maps_title: 'Where to <span class="where-to-find-blue">find us</span> ?',
  map_1_label: 'Calicut',
  map_1_url:
    'https://www.google.com/maps?ll=11.258926,75.809514&z=17&t=m&hl=en&gl=IN&mapclient=embed&cid=10680548857255058933&output=embed',
  map_2_label: 'Kochi',
  map_2_url:
    'https://www.google.com/maps?ll=9.975353,76.282945&z=16&t=m&hl=en&gl=IN&mapclient=embed&cid=6827443814145336761&output=embed',
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

  // ---------- 2. Create or update the 'contact' row ----------
  const { items } = await client.list('pages', { limit: 100 });
  const existing = items.find((i) => i.slug === 'contact');

  if (existing) {
    await client.update('pages', existing.id, { data: CONTACT_PAGE_VALUES });
    await client.publish('pages', existing.id);
    console.log(`Updated existing 'contact' row (id: ${existing.id}) with current page content.`);
  } else {
    const created = await client.create('pages', {
      slug: 'contact',
      data: { title: 'Contact Page', ...CONTACT_PAGE_VALUES },
    });
    await client.publish('pages', created.id);
    console.log("Created and published new 'contact' row with current page content.");
  }

  console.log('\n✅ Done!');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
