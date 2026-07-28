/**
 * Migration: stand up the "hiring_partners" collection in EmDash CMS and
 * wire the Hiring Partners page's hero copy onto the shared "pages"
 * collection.
 *
 * Unlike the other scripts in this folder, this one talks to EmDash through
 * its Node client (safe REST API + localhost-only "dev bypass" auth)
 * instead of raw SQL — no direct Postgres access.
 *
 * This script:
 *   1. Creates the "hiring_partners" collection if it doesn't exist yet,
 *      plus its two fields: `logo` (image) and `name` (string).
 *   2. Seeds all 40 hardcoded PARTNER_DEFAULTS rows (verbatim copy of the
 *      fallback array in src/pages/hiringpartners.astro) into that
 *      collection — but only if it's currently empty, so re-running this
 *      script is a no-op once seeded.
 *   3. Adds the shared hero_title / hero_subtitle / featured_title /
 *      featured_subtitle fields to the "pages" collection if missing (they
 *      likely already exist — blog/gallery/courses/etc pages already use
 *      them), then creates or updates the "pages" row for slug
 *      "hiringpartners" with the literal fallback copy from
 *      hiringpartners.astro so the CMS-driven values match what's already
 *      live.
 *
 * Run with: node scripts/migrate-hiring-partners-collection.js
 */

import { EmDashClient } from "emdash/client";

const client = new EmDashClient({ baseUrl: "http://localhost:4321", devBypass: true });

// Verbatim copy of PARTNER_DEFAULTS from src/pages/hiringpartners.astro (40 items).
const PARTNER_DEFAULTS = [
  { logo: "/images/hiringPartners/223x53-4.png", name: "KPMG" },
  { logo: "/images/hiringPartners/223x53-1.png", name: "Deloitte" },
  { logo: "/images/hiringPartners/223x53-2.png", name: "PwC" },
  { logo: "/images/hiringPartners/223x53-3.png", name: "EY" },
  { logo: "/images/hiringPartners/223x53-6.png", name: "JPMorgan Chase & Co." },
  { logo: "/images/hiringPartners/223x53-5.png", name: "Goldman Sachs" },
  { logo: "/images/hiringPartners/223x53-7.png", name: "HSBC" },
  { logo: "/images/hiringPartners/223x53-9.png", name: "Morgan Stanley" },
  { logo: "/images/hiringPartners/223x53-8.png", name: "Citibank" },
  { logo: "/images/hiringPartners/223x53-13.png", name: "McKinsey & Company" },
  { logo: "/images/hiringPartners/223x53-15.png", name: "Accenture" },
  { logo: "/images/hiringPartners/223x53-14.png", name: "Boston Consulting Group" },
  { logo: "/images/hiringPartners/223x53-28.png", name: "IBM" },
  { logo: "/images/hiringPartners/223x53-38.png", name: "Mazars" },
  { logo: "/images/hiringPartners/223x53-35.png", name: "Baker Tilly" },
  { logo: "/images/hiringPartners/223x53-36.png", name: "RSM" },
  { logo: "/images/hiringPartners/223x53-37.png", name: "Crowe" },
  { logo: "/images/hiringPartners/223x53-39.png", name: "Moore" },
  { logo: "/images/hiringPartners/223x53-40.png", name: "HLG International" },
  { logo: "/images/hiringPartners/223x53-42.png", name: "PKF" },
  { logo: "/images/hiringPartners/223x53-41.png", name: "Smith & Williamson" },
  { logo: "/images/hiringPartners/223x53-10.png", name: "Bank of America Merrill Lynch" },
  { logo: "/images/hiringPartners/223x53-16.png", name: "Grant Thornton" },
  { logo: "/images/hiringPartners/223x53-12.png", name: "Deutsche Bank" },
  { logo: "/images/hiringPartners/223x53-11.png", name: "Barclays" },
  { logo: "/images/hiringPartners/223x53-22.png", name: "Coca-Cola" },
  { logo: "/images/hiringPartners/223x53-17.png", name: "BDO" },
  { logo: "/images/hiringPartners/223x53-18.png", name: "Unilever" },
  { logo: "/images/hiringPartners/223x53-21.png", name: "GE" },
  { logo: "/images/hiringPartners/223x53-19.png", name: "P&G" },
  { logo: "/images/hiringPartners/223x53-20.png", name: "Nestlé" },
  { logo: "/images/hiringPartners/223x53-24.png", name: "Microsoft" },
  { logo: "/images/hiringPartners/223x53-25.png", name: "Apple" },
  { logo: "/images/hiringPartners/223x53-27.png", name: "Alphabet" },
  { logo: "/images/hiringPartners/223x53-29.png", name: "Johnson & Johnson" },
  { logo: "/images/hiringPartners/223x53-23.png", name: "PepsiCo" },
  { logo: "/images/hiringPartners/223x53-26.png", name: "Amazon" },
  { logo: "/images/hiringPartners/223x53-34.png", name: "Chevron" },
  { logo: "/images/hiringPartners/223x53-32.png", name: "ExxonMobil" },
  { logo: "/images/hiringPartners/223x53-30.png", name: "Siemens" },
];

// Literal fallback values from src/pages/hiringpartners.astro, to seed onto
// the "pages" collection's "hiringpartners" row.
const HIRING_PARTNERS_PAGE_VALUES = {
  hero_title: "Our Hiring Partners",
  hero_subtitle: "Make your dream career a reality with the world's leading companies!",
  featured_title: 'We\'re <span class="text-blue">Featured</span> On',
  featured_subtitle:
    "Recognized by leading media houses for our commitment to quality education and student success.",
};

// [slug, type, label] — fields required on "pages" for the hero/featured copy.
const PAGES_FIELDS = [
  ["hero_title", "string", "Hero Title"],
  ["hero_subtitle", "text", "Hero Subtitle"],
  ["featured_title", "string", "Featured On Title"],
  ["featured_subtitle", "text", "Featured On Subtitle"],
];

async function ensureHiringPartnersCollection() {
  console.log('Checking for "hiring_partners" collection...');
  const collections = await client.collections();
  if (!collections.some((c) => c.slug === "hiring_partners")) {
    console.log('Creating "hiring_partners" collection...');
    await client.createCollection({
      slug: "hiring_partners",
      label: "Hiring Partners",
      labelSingular: "Hiring Partner",
    });
    console.log('Created "hiring_partners" collection.');
  } else {
    console.log('"hiring_partners" collection already exists.');
  }

  const partnersCollection = await client.collection("hiring_partners");
  const existingFields = new Set(partnersCollection.fields.map((f) => f.slug));

  for (const [slug, type, label] of [
    ["logo", "image", "Logo"],
    ["name", "string", "Company Name"],
  ]) {
    if (!existingFields.has(slug)) {
      console.log(`Adding field "${slug}" (${type}) to "hiring_partners"...`);
      await client.createField("hiring_partners", { slug, type, label });
    } else {
      console.log(`Field "${slug}" already exists on "hiring_partners".`);
    }
  }
}

async function seedHiringPartners() {
  const { items: existingItems } = await client.list("hiring_partners", { limit: 100 });
  if (existingItems.length > 0) {
    console.log(
      `"hiring_partners" already has ${existingItems.length} item(s) — skipping seed.`,
    );
    return;
  }

  console.log(`Seeding ${PARTNER_DEFAULTS.length} hiring partner rows...`);
  let seeded = 0;
  for (const item of PARTNER_DEFAULTS) {
    const created = await client.create("hiring_partners", { data: item });
    await client.publish("hiring_partners", created.id);
    seeded += 1;
  }
  console.log(`Seeded ${seeded} "hiring_partners" rows.`);
}

async function ensurePagesFields() {
  console.log('Checking "pages" collection fields...');
  const pagesCollection = await client.collection("pages");
  const existingFields = new Set(pagesCollection.fields.map((f) => f.slug));

  for (const [slug, type, label] of PAGES_FIELDS) {
    if (!existingFields.has(slug)) {
      console.log(`Adding field "${slug}" (${type}) to "pages"...`);
      await client.createField("pages", { slug, type, label });
    } else {
      console.log(`Field "${slug}" already exists on "pages".`);
    }
  }
}

async function upsertHiringPartnersPageRow() {
  console.log('Looking for the "pages" row with slug "hiringpartners"...');
  let existing;
  for await (const item of client.listAll("pages", { limit: 100 })) {
    if (item.slug === "hiringpartners") {
      existing = item;
      break;
    }
  }

  if (existing) {
    console.log(`Found existing "hiringpartners" pages row (id ${existing.id}) — updating.`);
    await client.update("pages", existing.id, {
      data: { ...existing.data, ...HIRING_PARTNERS_PAGE_VALUES },
    });
    await client.publish("pages", existing.id);
    console.log('Updated "hiringpartners" pages row.');
  } else {
    console.log('No existing "hiringpartners" pages row — creating.');
    const created = await client.create("pages", {
      slug: "hiringpartners",
      data: { title: "Hiring Partners Page", ...HIRING_PARTNERS_PAGE_VALUES },
    });
    await client.publish("pages", created.id);
    console.log('Created and published "hiringpartners" pages row.');
  }
}

async function main() {
  console.log("Connecting to EmDash at http://localhost:4321 (dev bypass auth)...");

  await ensureHiringPartnersCollection();
  await seedHiringPartners();
  await ensurePagesFields();
  await upsertHiringPartnersPageRow();

  console.log("\n✅ Done!");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
