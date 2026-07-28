/**
 * Migration: push the Courses page's flat CMS fields and FAQ entries into
 * the live EmDash CMS via the safe REST API (Node client + "dev bypass"
 * auth, localhost-only) — no raw SQL.
 *
 * This mirrors what src/pages/courses.astro reads:
 *   - "pages" collection, slug "courses": hero, why-choose card, why-cards
 *     grid, opportunities section (title/desc/logos/cards), courses-we-offer
 *     cards, video banner, accreditation/stats grid, and featured-on strip.
 *   - "faq" collection: 7 rows with category "courses" (same collection/
 *     shape the ACCA page's FAQ accordion uses).
 *
 * Idempotent: re-running only creates fields/rows that don't already exist,
 * and skips the FAQ seed entirely if any "courses"-category rows are
 * already present.
 *
 * Run with: node scripts/migrate-courses-content.js
 */

import { EmDashClient } from "emdash/client";

const client = new EmDashClient({
  baseUrl: "http://localhost:4321",
  devBypass: true,
});

// ---------------------------------------------------------------------------
// "pages" collection field definitions: [slug, label, type]
// type: string (short/HTML text), text (long prose), image (plain path
// string value, not JSON-encoded).
// ---------------------------------------------------------------------------
const NEW_FIELDS = [
  ["hero_title", "Hero Title", "string"],
  ["hero_desc", "Hero Description", "text"],
  ["hero_ambassador_img", "Hero Brand Ambassador Image", "image"],

  ["choose_title", "Why Choose Card Title", "string"],
  ["choose_desc", "Why Choose Card Description", "text"],
  ["choose_cta_text", "Why Choose Card CTA Text", "string"],
  ["choose_img", "Why Choose Card Background Image", "image"],
];
for (let n = 1; n <= 4; n++) {
  NEW_FIELDS.push([`why_card_${n}_title`, `Why Card ${n} Title`, "string"]);
  NEW_FIELDS.push([`why_card_${n}_desc`, `Why Card ${n} Description`, "text"]);
}

NEW_FIELDS.push(["opportunities_title", "Opportunities Section Title", "string"]);
NEW_FIELDS.push(["opportunities_desc", "Opportunities Section Description", "text"]);
for (let n = 1; n <= 3; n++) {
  NEW_FIELDS.push([`opportunities_logo_${n}_img`, `Opportunities Logo ${n} Image`, "image"]);
}
for (let n = 1; n <= 4; n++) {
  NEW_FIELDS.push([`opportunity_card_${n}_title`, `Opportunity Card ${n} Title`, "string"]);
  NEW_FIELDS.push([`opportunity_card_${n}_desc`, `Opportunity Card ${n} Description`, "text"]);
}

for (let n = 1; n <= 2; n++) {
  NEW_FIELDS.push([`course_offer_${n}_img`, `Course Offer ${n} Image`, "image"]);
  NEW_FIELDS.push([`course_offer_${n}_desc`, `Course Offer ${n} Description`, "text"]);
  NEW_FIELDS.push([`course_offer_${n}_link_text`, `Course Offer ${n} Link Text`, "string"]);
}

NEW_FIELDS.push(["video_banner_title", "Video Banner Title", "string"]);
NEW_FIELDS.push(["video_banner_subtitle", "Video Banner Subtitle", "string"]);

for (let n = 1; n <= 8; n++) {
  NEW_FIELDS.push([`stats_card_${n}_icon`, `Stats Card ${n} Icon`, "image"]);
  NEW_FIELDS.push([`stats_card_${n}_text`, `Stats Card ${n} Text`, "string"]);
}

// featured_title / featured_subtitle already exist on "pages" (shared by the
// FeaturedOn.astro component across multiple pages) — included here so the
// script still works standalone against a fresh DB, but the
// existingPagesFieldSlugs check below will just skip creating them again.
NEW_FIELDS.push(["featured_title", "Featured On Title", "string"]);
NEW_FIELDS.push(["featured_subtitle", "Featured On Subtitle", "text"]);

// ---------------------------------------------------------------------------
// "pages" row data for slug "courses" — verbatim copies of the fallback
// values baked into src/pages/courses.astro.
// ---------------------------------------------------------------------------
const COURSES_PAGE_DATA = {
  hero_title:
    'Become a Globally Recognized <br /><span class="text-blue">Commerce Professional!</span>',
  hero_desc:
    "Gain the skills, credibility, and global recognition to excel in today's competitive business world with industry-relevant commerce professional courses.",
  hero_ambassador_img: "/images/mammu2.png",

  choose_title: 'Why Choose Commerce <br />Professional Courses?',
  choose_desc:
    "The finance and business world are evolving faster than ever with new technologies, global standards, and rising industry expectations. Commerce professional courses are designed to equip you with the practical skills, strategic mindset, and prestigious global credentials required to excel in today's competitive business landscape.",
  choose_cta_text: "Explore Programs",
  choose_img: "/images/courses/Slider-Elance-2.jpg",

  why_card_1_title: "Relevant in Today's <br />Job Market",
  why_card_1_desc:
    "These certifications are built around current industry demands, making you job-ready from day one.",
  why_card_2_title: "Practical & Global",
  why_card_2_desc:
    "They combine real-world applications with global recognition, opening doors across countries and industries.",
  why_card_3_title: "Trusted by <br />Employers",
  why_card_3_desc:
    "Top companies value professionals with specialised, updated skills —not just theoretical knowledge.",
  why_card_4_title: "Career-Focused",
  why_card_4_desc:
    "Designed for faster career progression, better roles, and leadership tracks.",

  opportunities_title: 'Opportunities with <br/>Commerce <br/>Professional <br/>Courses',
  opportunities_desc:
    "Commerce professional certifications are increasingly becoming the benchmark for hiring in finance, accounting, and business roles. Designed in line with global standards, these qualifications equip individuals with practical, up-to-date skills that meet the evolving needs of modern industries.",

  opportunities_logo_1_img: "/images/courses/trust.svg",
  opportunities_logo_2_img: "/images/courses/Silver-CMA.png",
  opportunities_logo_3_img: "/images/courses/CBE-Center.png",

  opportunity_card_1_title: "Global <br/>Recognition",
  opportunity_card_1_desc:
    "Commerce professional certifications like ACCA and CMA USA are recognised worldwide, giving professionals the flexibility to work abroad or with international firms operating in India.",
  opportunity_card_2_title: "Diverse Job <br/>Roles",
  opportunity_card_2_desc:
    "The commerce professional courses open doors to roles like Financial Analyst, Auditor, Tax Consultant, Risk Manager, and even CFO across both national and international markets.",
  opportunity_card_3_title: "Higher Earning <br/>Potential",
  opportunity_card_3_desc:
    "Certified commerce professionals in India typically earn 30-60% more than their non-certified peers. Entry-level salaries range from ₹6-10 LPA, with mid- to senior-level roles offering packages of ₹15-40 LPA and beyond, depending on the role and experience.",
  opportunity_card_4_title: "Career <br/>Versatility",
  opportunity_card_4_desc:
    "Certified professionals are eligible for roles across various sectors including banking, consulting, fintech, corporate finance, and public practice.",

  course_offer_1_img: "/images/accaimage-300x300.png",
  course_offer_1_desc:
    "ACCA is one of the world's most respected accounting qualifications, recognised in 180+ countries and trusted by over 7,600 approved employers globally. With a curriculum built around international standards, ethics, and digital finance, ACCA prepares professionals for high-impact roles in auditing, taxation, risk management, and financial strategy.",
  course_offer_1_link_text: "Learn More &rarr;",
  course_offer_2_img: "/images/cmaimage-300x300.png",
  course_offer_2_desc:
    "CMA USA is a globally recognised certification in management accounting, awarded by the Institute of Management Accountants (IMA). Recognised in 150+ countries and preferred by Fortune 500 companies, the CMA credential focuses on financial strategy, cost control, and performance analysis—making it ideal for professionals aiming for leadership roles in finance.",
  course_offer_2_link_text: "Learn More &rarr;",

  video_banner_title: 'Step Into a Future-Ready Finance <br />Career. <br />Choose Elance',
  video_banner_subtitle: "Begin your career now",

  stats_card_1_icon: "/images/courses/trophy.svg",
  stats_card_1_text: "44 World Ranks & 68 <br>National Ranks",
  stats_card_2_icon: "/images/courses/trust.svg",
  stats_card_2_text: "Platinum Approved <br>Partner of ACCA",
  stats_card_3_icon: "/images/courses/Silver-CMA.png",
  stats_card_3_text: "Silver CMA Course <br>Provider by IMA",
  stats_card_4_icon: "/images/courses/CBE-Center.png",
  stats_card_4_text: "ACCA Approved <br>CBE Centre",
  stats_card_5_icon: "/images/courses/Hock.png",
  stats_card_5_text: "Approved Partner of <br>HOCK International",
  stats_card_6_icon: "/images/courses/faculty.svg",
  stats_card_6_text: "India's No 1 <br>Faculty Line-Up",
  stats_card_7_icon: "/images/courses/100.svg",
  stats_card_7_text: "100/100 in FR <br>(ACCA Dec ‘24 <br>Session)",
  stats_card_8_icon: "/images/courses/pass.svg",
  stats_card_8_text: "5000+ Passes in the <br>Past 1 Year",

  featured_title: 'We\'re <span class="text-blue">Featured</span> On',
  featured_subtitle:
    "Recognized by leading media houses for our commitment to quality education and student success.",
};

// ---------------------------------------------------------------------------
// "faq" collection rows — category "courses". Verbatim from FAQ_DEFAULTS in
// src/pages/courses.astro.
// ---------------------------------------------------------------------------
const COURSES_FAQS = [
  [
    "Is professional certification better than a degree?",
    "While a university degree provides a broad academic foundation, professional certifications like ACCA and CMA USA focus on specialized, practical knowledge that is directly applicable to the workplace. Many employers prefer certified professionals because they are job-ready from day one, often leading to better roles and faster career progression.",
  ],
  [
    "Which certification is most suitable for a finance career?",
    "It depends on your career goals. If you want to specialize in global accounting, auditing, and taxation, ACCA is highly respected worldwide. If your focus is on management accounting, financial analysis, corporate finance, and strategic planning, CMA USA is the ideal choice.",
  ],
  [
    "Will a certification impact my salary?",
    "Yes, certified commerce professionals typically earn significantly more than their non-certified peers. In India, entry-level salaries for ACCA or CMA professionals range from ₹6–10 LPA, while experienced senior roles can offer packages of ₹15–40 LPA and beyond.",
  ],
  [
    "Can I pursue these certifications along with college or a job?",
    "Absolutely. Both ACCA and CMA USA offer flexible exam schedules and study options. You can prepare for the papers at your own pace, making it highly feasible to balance your study with college graduation (like B.Com) or full-time employment.",
  ],
  [
    "Which is the Best Institute to study ACCA in Calicut?",
    "Elance Learning is recognized as one of the premier learning institutes for ACCA in Calicut. With platinum-approved learning partner status, expert faculty, and high pass rates, we provide comprehensive training and placement support to ensure your success.",
  ],
  [
    "How long does it take to complete ACCA and CMA USA?",
    "CMA USA can typically be completed in 12 to 18 months as it consists of only 2 exam parts. ACCA, which has up to 13 papers depending on exemptions, generally takes 2 to 3 years to complete.",
  ],
  [
    "What makes Elance a leading ACCA institute in Kochi?",
    "Elance's Kochi campus offers state-of-the-art classroom facilities, direct mentorship programs, industry-aligned course material, and an active placement cell. Our status as a Licensed CBE Centre also allows students to take exams locally and conveniently.",
  ],
];

async function main() {
  console.log("Connecting to EmDash CMS at http://localhost:4321 (dev bypass)...");

  // ---------- 1. "pages" collection: create any missing fields ----------
  const pagesCollection = await client.collection("pages");
  const existingPagesFieldSlugs = new Set(pagesCollection.fields.map((f) => f.slug));
  console.log(`"pages" collection has ${existingPagesFieldSlugs.size} existing fields.`);

  let addedFields = 0;
  for (const [slug, label, type] of NEW_FIELDS) {
    if (existingPagesFieldSlugs.has(slug)) continue;
    await client.createField("pages", { slug, type, label });
    existingPagesFieldSlugs.add(slug);
    addedFields += 1;
    console.log(`  + created field "${slug}" (${type})`);
  }
  console.log(`Created ${addedFields} new field(s) on "pages" (${NEW_FIELDS.length - addedFields} already existed).`);

  // ---------- 2. "pages" row: create or update the "courses" entry ----------
  const { items } = await client.list("pages", { limit: 100 });
  const existingCourses = items.find((i) => i.slug === "courses");

  if (existingCourses) {
    await client.update("pages", existingCourses.id, { data: COURSES_PAGE_DATA });
    await client.publish("pages", existingCourses.id);
    console.log(`Updated existing "courses" row (id: ${existingCourses.id}) with ${Object.keys(COURSES_PAGE_DATA).length} fields.`);
  } else {
    const created = await client.create("pages", {
      slug: "courses",
      data: { title: "Courses Page", ...COURSES_PAGE_DATA },
    });
    await client.publish("pages", created.id);
    console.log(`Created and published new "courses" row (id: ${created.id}) with ${Object.keys(COURSES_PAGE_DATA).length} fields.`);
  }

  // ---------- 3. "faq" collection: seed the 7 "courses" rows ----------
  const { items: faqItems } = await client.list("faq", { limit: 100 });
  const alreadySeeded = faqItems.some((i) => i.data?.category === "courses");

  if (alreadySeeded) {
    const count = faqItems.filter((i) => i.data?.category === "courses").length;
    console.log(`"faq" collection already has ${count} "courses"-category row(s) — skipping FAQ seed.`);
  } else {
    let addedFaqs = 0;
    for (const [question, answer] of COURSES_FAQS) {
      const item = await client.create("faq", {
        data: { question, answer, category: "courses" },
      });
      await client.publish("faq", item.id);
      addedFaqs += 1;
    }
    console.log(`Seeded ${addedFaqs} FAQ row(s) into "faq" with category "courses".`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
