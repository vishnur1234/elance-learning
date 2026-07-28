/**
 * Migration: wire up CMS fields for the four shared components that were
 * just given an optional `entry` prop:
 *   - AchievementsSection.astro   (used on acca ONLY)
 *   - CareerAndWhyElance.astro    (used on acca AND cma)
 *   - StudentThinkBanner.astro    (used on acca ONLY)
 *   - StudentPlacements.astro     (used on acca AND cma)
 *
 * This script:
 *   1. Creates every field used by the four components on the 'pages'
 *      collection via the EmDash REST API (skipping any that already exist).
 *   2. Updates the 'acca' row's data with ALL fields from all four
 *      components (byte-identical to each component's current literal
 *      fallback, so visible output is unchanged after the field goes live).
 *   3. Updates the 'cma' row's data with ONLY the CareerAndWhyElance +
 *      StudentPlacements fields (same field names/values as acca's copy,
 *      since both pages currently render identical content for these two
 *      shared components).
 *
 * Uses EmDash's Node client library (safe REST API + "dev bypass" auth,
 * localhost-only) against the already-running local dev server — no raw SQL.
 *
 * Run with: node scripts/migrate-shared-components-content.js
 */

import { EmDashClient } from "emdash/client";

const client = new EmDashClient({ baseUrl: "http://localhost:4321", devBypass: true });

// ---------------------------------------------------------------------------
// Field definitions: [slug, label, type]
// type: 'string' (short/HTML text), 'text' (long prose), 'image' (plain path
// string value, not JSON-encoded).
// ---------------------------------------------------------------------------

const ACHIEVEMENTS_FIELDS = [
  ["achievements_title", "Achievements Title", "string"],
  ["achievements_subtitle", "Achievements Subtitle", "text"],
  ["achievement_1_num", "Achievement 1 Number", "string"],
  ["achievement_1_label", "Achievement 1 Label", "string"],
  ["achievement_2_num", "Achievement 2 Number", "string"],
  ["achievement_2_label", "Achievement 2 Label", "string"],
];

const CAREER_FIELDS = [
  ["career_heading", "Career Section Heading", "string"],
  ...Array.from({ length: 8 }, (_, i) => i + 1).flatMap((n) => [
    [`career_item_${n}_title`, `Career Item ${n} Title`, "string"],
    [`career_item_${n}_desc`, `Career Item ${n} Description`, "text"],
  ]),
  ["why_title", "Why Elance Title", "string"],
  ...Array.from({ length: 12 }, (_, i) => i + 1).map((n) => [
    `why_item_${n}_text`,
    `Why Item ${n} Text`,
    "string",
  ]),
];

const THINK_FIELDS = [
  ["think_title", "Student Think Banner Title", "string"],
  ...Array.from({ length: 3 }, (_, i) => i + 1).flatMap((n) => [
    [`think_testimonial_${n}_photo`, `Think Testimonial ${n} Photo`, "image"],
    [`think_testimonial_${n}_quote`, `Think Testimonial ${n} Quote`, "text"],
    [`think_testimonial_${n}_author`, `Think Testimonial ${n} Author`, "string"],
    [`think_testimonial_${n}_company`, `Think Testimonial ${n} Company`, "string"],
  ]),
];

const PLACEMENTS_FIELDS = [
  ["placements_title", "Placements Section Title", "string"],
  ["placement_gt_img", "Placement Logo: Grant Thornton", "image"],
  ["placement_deloitte_img", "Placement Logo: Deloitte", "image"],
  ["placement_ey_img", "Placement Logo: EY", "image"],
  ["placement_pwc_img", "Placement Logo: PwC", "image"],
];

const ALL_FIELDS = [
  ...ACHIEVEMENTS_FIELDS,
  ...CAREER_FIELDS,
  ...THINK_FIELDS,
  ...PLACEMENTS_FIELDS,
];

// ---------------------------------------------------------------------------
// Values — copied verbatim from each component's literal fallback.
// ---------------------------------------------------------------------------

const ACHIEVEMENTS_VALUES = {
  achievements_title: "Achievements",
  achievements_subtitle:
    "With immense pride, we underscore our outstanding results, a testament to Elance's legacy since its inception. In just four years, Elance has consistently delivered unmatched results, guiding students towards their dream careers as top-class commerce professionals. These achievements aren't just milestones; they represent our unwavering dedication to nurturing the future leaders of the industry.",
  achievement_1_num: "53",
  achievement_1_label: "World Ranks",
  achievement_2_num: "80",
  achievement_2_label: "National Ranks",
};

const CAREER_ITEM_DEFAULTS = [
  { title: "Financial Controller", desc: "As a financial controller, ACCA graduates oversee financial reporting, budgeting, and strategic planning, ensuring the financial health and compliance of an organization while providing key insights for decision-making." },
  { title: "Audit Manager", desc: "Audit Managers oversee internal and external audits, ensuring financial statements comply with regulatory standards and identifying operational efficiencies and risk management opportunities." },
  { title: "Tax Consultant", desc: "Tax Consultants provide advisory and compliance services, helping clients minimize tax liabilities and navigate complex local and international tax regulations." },
  { title: "Management Accountant", desc: "Management Accountants analyze financial information to support internal business planning, forecasting, budgeting, and strategic decision-making by managers." },
  { title: "Business Consultant", desc: "Business Consultants analyze business operations, identify problems, and recommend solutions to improve efficiency, profitability, and growth." },
  { title: "Financial Advisor", desc: "Financial Advisors help individuals and organizations manage their finances, invest wisely, and plan for future financial goals." },
  { title: "Finance Manager", desc: "Finance Managers oversee the financial operations of an organization, managing budgets, financial planning, and investment strategies to ensure long-term stability." },
  { title: "Investment Analyst", desc: "Investment Analysts research financial information and market trends to provide investment recommendations and support asset management decisions." },
];

const WHY_ITEM_DEFAULTS = [
  "Exceptional Faculty Standards With 13+ Years of Experience",
  "Outstanding Track Record of Achievements",
  "ACCA Platinum Accredited Partner",
  "Official CBE Centre",
  "Guaranteed Placement Assistance",
  "Comprehensive Support from Faculties, Mentors & Coordinators",
  "Offline, Online & Hybrid Classes",
  "24/7 Access to Elance Learning App",
  "Access To Study Buddy to Connect with Likeminded Students",
  "Study Planner App for organized preparation",
  "Prime & Prime + Programs for Advanced Learning",
  "Hassle-free Hostel Facility and Safe Transportation Service",
];

const CAREER_VALUES = {
  career_heading: 'Land your <span class="text-blue">Dream Career</span>',
  ...Object.fromEntries(
    CAREER_ITEM_DEFAULTS.flatMap((item, i) => {
      const n = i + 1;
      return [
        [`career_item_${n}_title`, item.title],
        [`career_item_${n}_desc`, item.desc],
      ];
    }),
  ),
  why_title: "Why Elance?",
  ...Object.fromEntries(
    WHY_ITEM_DEFAULTS.map((text, i) => [`why_item_${i + 1}_text`, text]),
  ),
};

const THINK_TESTIMONIAL_DEFAULTS = [
  {
    photo: "/images/i1.jpg",
    quote: '"With Elance, you won\'t feel like you\'re missing out on the college vibe."',
    author: "Shringa Surendran",
    company: "KPMG",
  },
  {
    photo: "/images/i2.jpg",
    quote: '"The faculty at Elance is extremely supportive, guiding me at every step of my ACCA journey."',
    author: "Vaishnav Unny",
    company: "PwC",
  },
  {
    photo: "/images/Abhiram-testi.jpg",
    quote: '"Elance provided me with the resources and confidence to clear my papers on the first attempt."',
    author: "Siya Sabu",
    company: "EY",
  },
];

const THINK_VALUES = {
  think_title:
    'What our<br />Students <svg class="elance-logo-mark" viewBox="0 0 30 20" aria-label="Elance Logo Mark"><rect x="0" y="2" width="28" height="4" fill="#3b9fe8" rx="2"/><rect x="0" y="8" width="20" height="4" fill="#3b9fe8" rx="2"/><rect x="0" y="14" width="12" height="4" fill="#3b9fe8" rx="2"/></svg> think<br />about us?',
  ...Object.fromEntries(
    THINK_TESTIMONIAL_DEFAULTS.flatMap((t, i) => {
      const n = i + 1;
      return [
        [`think_testimonial_${n}_photo`, t.photo],
        [`think_testimonial_${n}_quote`, t.quote],
        [`think_testimonial_${n}_author`, t.author],
        [`think_testimonial_${n}_company`, t.company],
      ];
    }),
  ),
};

const PLACEMENTS_VALUES = {
  placements_title:
    'Our Students Made It – <span class="text-blue">Now It\'s Your Turn!</span>',
  placement_gt_img: "/images/grant-thornton.png",
  placement_deloitte_img: "/images/deloitte.png",
  placement_ey_img: "/images/ey.png",
  placement_pwc_img: "/images/pwc.png",
};

// acca gets all four components' fields; cma gets only Career + Placements.
const ACCA_DATA = {
  ...ACHIEVEMENTS_VALUES,
  ...CAREER_VALUES,
  ...THINK_VALUES,
  ...PLACEMENTS_VALUES,
};

const CMA_DATA = {
  ...CAREER_VALUES,
  ...PLACEMENTS_VALUES,
};

async function main() {
  console.log("Connecting to EmDash dev server...");

  const pagesCollection = await client.collection("pages");
  const existingFieldSlugs = new Set(pagesCollection.fields.map((f) => f.slug));

  let created = 0;
  let skipped = 0;
  for (const [slug, label, type] of ALL_FIELDS) {
    if (existingFieldSlugs.has(slug)) {
      skipped += 1;
      continue;
    }
    await client.createField("pages", { slug, type, label });
    existingFieldSlugs.add(slug);
    created += 1;
    console.log(`Created field: ${slug} (${type})`);
  }
  console.log(`Fields: ${created} created, ${skipped} already existed.`);

  const { items } = await client.list("pages", { limit: 100 });
  const accaRow = items.find((i) => i.slug === "acca");
  const cmaRow = items.find((i) => i.slug === "cma");

  if (accaRow) {
    await client.update("pages", accaRow.id, { data: ACCA_DATA });
    console.log(`Updated 'acca' row (${Object.keys(ACCA_DATA).length} fields).`);
  } else {
    console.error("'acca' row not found in 'pages' collection — skipped update.");
  }

  if (cmaRow) {
    await client.update("pages", cmaRow.id, { data: CMA_DATA });
    console.log(`Updated 'cma' row (${Object.keys(CMA_DATA).length} fields).`);
  } else {
    console.error("'cma' row not found in 'pages' collection — skipped update.");
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
