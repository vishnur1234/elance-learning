/**
 * Migration: wire up the About page for full EmDash CMS editing.
 *
 * src/pages/about.astro now reads all of its dynamic copy from
 * getEmDashEntry("pages", "about"), with literal fallbacks matching what's
 * currently hard-coded (so the page renders unchanged until this data is
 * live in the CMS). This script pushes those same field definitions +
 * values into the live EmDash CMS over its official REST API, using
 * "dev bypass" auth (only works against localhost), so they become
 * genuinely editable from the CMS admin.
 *
 * This script:
 *   1. Creates any missing fields on the 'pages' collection (skips fields
 *      that already exist, so it's safe to re-run).
 *   2. Creates a 'pages' row with slug 'about' (or updates it, if one
 *      already exists) with a data object matching about.astro's current
 *      literal fallbacks exactly.
 *
 * Run with: node scripts/migrate-about-content.js
 */

import { EmDashClient } from "emdash/client";

const client = new EmDashClient({
  baseUrl: "http://localhost:4321",
  devBypass: true,
});

// [slug, label, type]
const NEW_FIELDS = [
  ["intro_title", "Intro Hero Title", "string"],
  ["intro_desc", "Intro Hero Description", "text"],
  ["commitment_title", "Commitment Section Title", "string"],
];
for (let n = 1; n <= 5; n++) {
  NEW_FIELDS.push([`feature_${n}_title`, `Feature ${n} Title`, "string"]);
  NEW_FIELDS.push([`feature_${n}_desc`, `Feature ${n} Description`, "text"]);
}
NEW_FIELDS.push(["mission_title", "Mission & Vision Title", "string"]);
NEW_FIELDS.push(["mission_text", "Mission & Vision Text", "text"]);
NEW_FIELDS.push(["impact_title", "Impact Section Title", "string"]);
NEW_FIELDS.push(["impact_text", "Impact Text", "text"]);
NEW_FIELDS.push(["impact_detail", "Impact Detail", "text"]);
NEW_FIELDS.push(["impact_closing", "Impact Closing", "text"]);

// Values to set on the 'about' pages row. Copied verbatim from the literal
// fallbacks currently in src/pages/about.astro.
const ABOUT_PAGE_VALUES = {
  intro_title: 'About <span class="about-intro-blue">Us</span>',
  intro_desc:
    "Elance, India's premium commerce platform, excels in delivering esteemed professional accounting courses, such as ACCA & CMA USA. Supported by a team of highly skilled educators, our platform's core ethos revolves around accessibility and excellence in commerce education. Our remarkable growth trajectory, surging from 22 students in 2018 to nurturing a global cohort exceeding 25,000, is a testament to our unwavering dedication to providing exceptional educational opportunities. Elance proudly stands as the foremost platform for those seeking top-tier finance certifications and a comprehensive learning experience in commerce.",
  commitment_title:
    '<span class="about-commitment-blue">Above and Beyond</span>: A Commitment to Quality',
  feature_1_title: "Faculty Line-Up",
  feature_1_desc:
    "At Elance, we boast an unparalleled faculty composed of India's top educators, each with extensive experience and impressive national and world rankings. The quality services they provide have enabled countless students to achieve their dream careers in commerce.",
  feature_2_title: "All-around Assistance for Effective Learning",
  feature_2_desc:
    "At Elance, students benefit from a complete learning ecosystem that goes beyond faculty support. With top-ranked mentors, dedicated coordinators, and a comprehensive learning app, they receive well-rounded guidance for their preparation.",
  feature_3_title: "Enhancing Learning Through Advanced Technology",
  feature_3_desc:
    "At Elance, we prioritize innovation and technology to simplify the learning process for mastering commerce professional courses. Features like Study Buddy and Study Planners are direct outcomes of this integration, enhancing the overall student experience.",
  feature_4_title: "24/7 Access to Elance Learning App",
  feature_4_desc:
    "The Elance Learning App offers flexibility for students and working professionals, allowing them to choose between online, offline, or hybrid learning modes. It provides easy access to courses, enabling users to upskill at their convenience anytime, anywhere.",
  feature_5_title: "Bridging Learning with Practical, Industry-Relevant Experience",
  feature_5_desc:
    "At Elance, we focus on bridging theory with practice, offering students the chance to excel through real-world experiences. Programs like EDGE '24 – Elance Driven Growth for Entrepreneurs provide valuable hands-on opportunities, helping aspirants master the skills needed to lead the industry. Global Recognition for Innovation Elance's dedication to innovation has earned global recognition! We are honored to be selected by Google for Startups, in collaboration with MeitY, to be a part of the AI Academy India 2024. This prestigious inclusion is a testament to our relentless pursuit of excellence and impactful solutions.",
  mission_title: "Our Mission & Vision",
  mission_text:
    "Our mission is to revolutionize education by breaking conventional patterns by integrating cutting-edge technology and innovation to create personalized learning experiences. We are dedicated to providing students with real-life experiences and practical knowledge through a practitioner-based approach, ensuring they are well-equipped with the essential skills needed to meet the ever-evolving demands of the industry. By fostering an environment that emphasizes quality education and skill development, we aim to empower our students to excel in their careers and make a meaningful impact in their fields. At Elance, we are committed to helping every commerce aspirant turn their dream of becoming a top-class commerce professional into a reality.",
  impact_title: 'Our <span class="about-impact-blue">Impact</span>',
  impact_text:
    "We believe we have significantly transformed the commerce education industry by revolutionizing the delivery of quality learning.",
  impact_detail:
    'Rather than adhering to conventional educational methods, we have successfully integrated innovation and technology to provide a more personalized education to commerce aspirants. In just five years, our unwavering commitment has empowered over 25,000 students leading them to become exceptional commerce professionals. We take pride in our achievements, including <strong>49 World & 76 National Ranks</strong>. Our high-quality services have helped bridge the skill gap in the industry, producing professionals who excel and meet the demands of leading employers in national and international MNCs, including the Big Four.',
  impact_closing:
    "By fostering a supportive and holistic environment, we continue to shape the future of commerce professionals and contribute to a dynamic professional culture.",
};

async function main() {
  console.log("Connecting to EmDash CMS at http://localhost:4321 (dev bypass)...");

  // ---------- 1. Create any missing fields on the 'pages' collection ----------
  const pagesCollection = await client.collection("pages");
  const existingFieldSlugs = new Set(pagesCollection.fields.map((f) => f.slug));

  let addedFields = 0;
  for (const [slug, label, type] of NEW_FIELDS) {
    if (existingFieldSlugs.has(slug)) continue;
    await client.createField("pages", { slug, type, label });
    existingFieldSlugs.add(slug);
    addedFields += 1;
    console.log(`Created field: ${slug} (${type})`);
  }
  console.log(`Fields: ${addedFields} created, ${NEW_FIELDS.length - addedFields} already existed.`);

  // ---------- 2. Create (or update) the 'about' content row ----------
  const { items } = await client.list("pages", { limit: 100 });
  const existing = items.find((i) => i.slug === "about");

  if (existing) {
    await client.update("pages", existing.id, { data: ABOUT_PAGE_VALUES });
    await client.publish("pages", existing.id);
    console.log(`Updated existing 'about' row (id: ${existing.id}) with ${Object.keys(ABOUT_PAGE_VALUES).length} fields.`);
  } else {
    const created = await client.create("pages", {
      slug: "about",
      data: { title: "About Us Page", ...ABOUT_PAGE_VALUES },
    });
    await client.publish("pages", created.id);
    console.log(`Created and published new 'about' row with ${Object.keys(ABOUT_PAGE_VALUES).length} fields.`);
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
