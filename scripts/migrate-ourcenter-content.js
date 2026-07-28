/**
 * Migration: wire up the Our Centers page for full EmDash CMS editing.
 *
 * src/pages/ourcenter.astro now fetches its copy from the shared 'pages'
 * collection (slug 'ourcenter') via getEmDashEntry, with byte-identical
 * literal fallbacks for every field it reads. This script pushes those same
 * field definitions + current literal values into the LIVE EmDash CMS so
 * they become genuinely editable in the CMS admin, using EmDash's official
 * REST client with "dev bypass" auth (only valid against localhost) — no
 * raw SQL, no direct DB access.
 *
 * This script:
 *   1. Creates the new fields (hero_*, campus_1/2_*, feature_1-6_*,
 *      celebrations_*, excellence_1/2_*, featured_title/featured_subtitle)
 *      on the 'pages' collection — skipping any that already exist (e.g.
 *      featured_title/featured_subtitle are shared with other pages that
 *      also render <FeaturedOn>).
 *   2. Creates (or updates, if already present) the 'pages' row with slug
 *      'ourcenter', status 'published', setting its data to match
 *      ourcenter.astro's current literal fallbacks exactly.
 *
 * Run with: node scripts/migrate-ourcenter-content.js
 */

import { EmDashClient } from 'emdash/client';

const client = new EmDashClient({ baseUrl: 'http://localhost:4321', devBypass: true });

// [slug, label, type]
const NEW_FIELDS = [
  ['hero_eyebrow', 'Hero Eyebrow', 'string'],
  ['hero_title', 'Hero Title', 'string'],
  ['hero_desc', 'Hero Description', 'text'],
  ['hero_cta_text', 'Hero CTA Button Text', 'string'],
  ['hero_img', 'Hero Image', 'image'],
];
for (let n = 1; n <= 2; n++) {
  NEW_FIELDS.push([`campus_${n}_title`, `Campus ${n} Title`, 'string']);
  NEW_FIELDS.push([`campus_${n}_desc`, `Campus ${n} Description`, 'text']);
  NEW_FIELDS.push([`campus_${n}_cta_text`, `Campus ${n} CTA Button Text`, 'string']);
  NEW_FIELDS.push([`campus_${n}_video`, `Campus ${n} Video Embed URL`, 'string']);
}
for (let n = 1; n <= 6; n++) {
  NEW_FIELDS.push([`feature_${n}_icon`, `Feature ${n} Icon`, 'image']);
  NEW_FIELDS.push([`feature_${n}_text`, `Feature ${n} Text`, 'string']);
}
NEW_FIELDS.push(['celebrations_title', 'Celebrations Section Title', 'string']);
NEW_FIELDS.push(['celebrations_desc', 'Celebrations Description', 'text']);
NEW_FIELDS.push(['celebrations_detail', 'Celebrations Detail', 'text']);
for (let n = 1; n <= 2; n++) {
  NEW_FIELDS.push([`excellence_${n}_title`, `Excellence ${n} Title`, 'string']);
  NEW_FIELDS.push([`excellence_${n}_text`, `Excellence ${n} Text`, 'text']);
}
NEW_FIELDS.push(['featured_title', 'Featured On Title', 'string']);
NEW_FIELDS.push(['featured_subtitle', 'Featured On Subtitle', 'text']);

// Values to set on the 'ourcenter' pages row — copied verbatim from the
// literal fallbacks in src/pages/ourcenter.astro so the visible copy is
// byte-identical before and after this migration.
const OURCENTER_PAGE_VALUES = {
  hero_eyebrow: 'Welcome to',
  hero_title: "India's Most Trusted<br />Commerce Institute",
  hero_desc:
    "Begin your journey in a space alive with ambition, connection, and opportunity. Whether you're at our vibrant Calicut campus or the dynamic Kochi campus, every moment at Elance invites you to grow your skills, build meaningful relationships, and enjoy the spirited pulse of campus life. Here, education goes beyond the classroom— offering professional commerce qualifications that empowers your career while creating memories that last a lifetime.",
  hero_cta_text: 'Begin your career now',
  hero_img: '/images/ourcenter/Our-Center-BIG-M-Banner.png',

  campus_1_title: 'Elance Kochi Campus',
  campus_1_desc:
    "Our Kochi campus blends focus with freshness! A space where ambition excels alongside friendly faces, coffee breaks, and real-world learning. From expert-led sessions to campus moments you'll always remember, it's where growth feels good.",
  campus_1_cta_text: 'Know more',
  campus_1_video: 'https://www.youtube.com/embed/cGtbeaH_x88',

  campus_2_title: 'Elance Calicut Campus',
  campus_2_desc:
    "At our Calicut campus, learning is just one part of the experience. It's a space filled with energy, connection, and the kind of support that helps you grow inside the classroom and beyond. Here, every day brings new ideas and memorable moments.",
  campus_2_cta_text: 'Know more',
  campus_2_video: 'https://www.youtube.com/embed/TWKK0uhj_QY',

  feature_1_icon: '/images/ourcenter/Classroom.svg',
  feature_1_text: 'Modern, well-equipped classrooms',
  feature_2_icon: '/images/ourcenter/Discussion.svg',
  feature_2_text: 'Tech-enabled learning spaces with high-speed internet',
  feature_3_icon: '/images/ourcenter/Environment.svg',
  feature_3_text: 'Student-friendly common areas for discussions and collaboration',
  feature_4_icon: '/images/ourcenter/Mentor-Support.svg',
  feature_4_text: 'Easy access to faculty and mentors for academic support',
  feature_5_icon: '/images/ourcenter/Meeting-room.svg',
  feature_5_text: 'Space for events, celebrations, and student-led initiatives',
  feature_6_icon: '/images/ourcenter/Tech-Enabled-Space.svg',
  feature_6_text: 'Calm, clean environment designed to keep students focused',

  celebrations_title: 'Celebrations, Culture & Campus Spirit',
  celebrations_desc:
    'At Elance, achievement and celebration go hand in hand. Our campuses come alive with vibrant cultural fests, spirited events, and thrilling sports moments that leave a lasting impact.',
  celebrations_detail:
    'From festive gatherings and talent showcases to high-energy sports competitions and our flagship annual event Elan Festa, every occasion brings students together to connect, express, and celebrate. Both Kochi and Calicut campuses offer a dynamic space where culture, creativity, and campus spirit thrive.',

  excellence_1_title: 'Academic Excellence with Personalised Support',
  excellence_1_text:
    'At Elance, learning is not limited to textbooks. We foster a well-rounded environment where students grow intellectually, emotionally, and personally. Our distinctive 4-tier support system—including expert faculty, dedicated mentors, approachable coordinators, and trained psychological counsellors—ensures every student receives the right guidance at every stage of their journey through our commerce professional courses and beyond.',
  excellence_2_title: 'Career-Focused Student Journey',
  excellence_2_text:
    "We combine strong academic foundations with hands-on exposure to prepare students for success beyond the classroom. Designed to provide the best commerce courses in India, our programs are enriched with initiatives like the Prime+ Program, leadership development platforms, and industry-aligned experiences—such as the EDGE '24 pitching challenge, LEAP '25, a case study collaboration with IIM Mumbai, and the Excel Hackathon. Students gain real-world skills and confidence to become industry-ready global commerce professionals.",

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
    existingFieldSlugs.add(slug);
    addedFields += 1;
  }
  console.log(`Added ${addedFields} new field(s) to the 'pages' collection.`);

  // ---------- 2. Create or update the 'ourcenter' row ----------
  const { items } = await client.list('pages', { limit: 100 });
  const existing = items.find((i) => i.slug === 'ourcenter');

  if (existing) {
    await client.update('pages', existing.id, { data: OURCENTER_PAGE_VALUES });
    await client.publish('pages', existing.id);
    console.log(`Updated existing 'ourcenter' row (id: ${existing.id}) with current page content.`);
  } else {
    const created = await client.create('pages', {
      slug: 'ourcenter',
      data: { title: 'Our Center Page', ...OURCENTER_PAGE_VALUES },
    });
    await client.publish('pages', created.id);
    console.log("Created and published new 'ourcenter' row with current page content.");
  }

  console.log('\n✅ Done!');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
