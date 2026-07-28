/**
 * Migration: seed the Calicut, Kannur, and Kochi center pages' dynamic
 * content into the live EmDash CMS as three separate rows in the "pages"
 * collection (slugs: calicutcenter, kannurcenter, kochicenter).
 *
 * Background: src/pages/calicutcenter.astro, kannurcenter.astro, and
 * kochicenter.astro were each independently wired to fetch
 * getEmDashEntry("pages", "<own-slug>") with byte-identical-shaped literal
 * fallbacks (only the actual values differ by city). The three pages mostly
 * share the same field-naming scheme, but three fields have inconsistent
 * slugs between pages:
 *
 *   - hero video source:   calicut/kannur use `hero_video`,
 *                           kochi uses `hero_video_src`
 *   - location map embed:  calicut uses `location_{n}_map`,
 *                           kannur/kochi use `location_{n}_map_src`
 *   - CTA button text:     calicut/kochi use `cta_btn_text`,
 *                           kannur uses `cta_button_text`
 *
 * This script creates the UNION of all field-slug variants once on the
 * shared "pages" collection schema (skipping any that already exist), then
 * creates/updates the three page rows with each city's own exact values
 * using only the field names that city's page actually reads.
 *
 * Uses EmDash's Node client library (safe REST API + localhost-only dev
 * bypass auth) — no raw SQL. Run with: node scripts/migrate-center-pages-content.js
 */

import { EmDashClient } from "emdash/client";

const client = new EmDashClient({
  baseUrl: "http://localhost:4321",
  devBypass: true,
});

// [slug, label, type] — union of all field-slug variants used across the
// three center pages. type: "string" (short/HTML text), "text" (long prose),
// "image" (plain path string value, not JSON-encoded).
const NEW_FIELDS = [
  // Hero
  ["hero_video", "Hero Video (calicut/kannur)", "image"],
  ["hero_video_src", "Hero Video Src (kochi)", "image"],
  ["hero_eyebrow", "Hero Eyebrow", "string"],
  ["hero_title", "Hero Title", "string"],
  ["hero_desc", "Hero Description", "text"],
  ["hero_cta_1_text", "Hero CTA 1 Text", "string"],
  ["hero_cta_1_link", "Hero CTA 1 Link", "string"],
  ["hero_cta_2_text", "Hero CTA 2 Text", "string"],
  ["hero_cta_2_link", "Hero CTA 2 Link", "string"],

  // Learning Ecosystem
  ["ecosystem_title", "Ecosystem Title", "string"],
  ["ecosystem_desc", "Ecosystem Description", "text"],
  ["badge_1_img", "Badge 1 Image", "image"],
  ["badge_2_img", "Badge 2 Image", "image"],
  ["badge_3_img", "Badge 3 Image", "image"],
  ["ambassador_img", "Ambassador Image", "image"],
];

// Location blocks (2 per page)
for (let n = 1; n <= 2; n++) {
  NEW_FIELDS.push([`location_${n}_map`, `Location ${n} Map Embed URL (calicut)`, "string"]);
  NEW_FIELDS.push([`location_${n}_map_src`, `Location ${n} Map Embed URL (kannur/kochi)`, "string"]);
  NEW_FIELDS.push([`location_${n}_name`, `Location ${n} Name`, "string"]);
  NEW_FIELDS.push([`location_${n}_address`, `Location ${n} Address`, "string"]);
  NEW_FIELDS.push([`location_${n}_phone`, `Location ${n} Phone`, "string"]);
  NEW_FIELDS.push([`location_${n}_email`, `Location ${n} Email`, "string"]);
}

// CTA Banner
NEW_FIELDS.push(["cta_title", "CTA Title", "string"]);
NEW_FIELDS.push(["cta_desc", "CTA Description", "text"]);
NEW_FIELDS.push(["cta_btn_text", "CTA Button Text (calicut/kochi)", "string"]);
NEW_FIELDS.push(["cta_button_text", "CTA Button Text (kannur)", "string"]);

// 4 Pillars
for (let n = 1; n <= 4; n++) {
  NEW_FIELDS.push([`pillar_${n}_img`, `Pillar ${n} Image`, "image"]);
  NEW_FIELDS.push([`pillar_${n}_title`, `Pillar ${n} Title`, "string"]);
  NEW_FIELDS.push([`pillar_${n}_subtitle`, `Pillar ${n} Subtitle`, "string"]);
  NEW_FIELDS.push([`pillar_${n}_desc`, `Pillar ${n} Description`, "text"]);
}

// Featured On
NEW_FIELDS.push(["featured_title", "Featured On Title", "string"]);
NEW_FIELDS.push(["featured_subtitle", "Featured On Subtitle", "text"]);

// ── Per-city data, copied verbatim from each page's current literal
// fallbacks. Only the field names each page actually reads are populated. ──

const CALICUT_DATA = {
  hero_video: "/images/ourcenter/calicut/Elance-Calicut.mp4",
  hero_eyebrow: "WELCOME TO THE",
  hero_title: "Best Commerce Institute<br />in Calicut",
  hero_desc:
    "Welcome to a world filled with energy, endless learning, and epic memories. At Elance, your career excels as you celebrate friendships, festivities, and every exciting moment in between!",
  hero_cta_1_text: "ACCA",
  hero_cta_1_link: "/acca",
  hero_cta_2_text: "CMA USA",
  hero_cta_2_link: "/cma",

  ecosystem_title: "A Complete Learning<br />Ecosystem",
  ecosystem_desc:
    "At Elance, education is an experience that goes beyond textbooks. We aim to create a supportive and inspiring space where students can learn, grow, and discover their full potential—both inside and outside the classroom.",
  badge_1_img: "/images/ourcenter/calicut/ACCA-Platinum.png",
  badge_2_img: "/images/ourcenter/calicut/Silver-CMA.png",
  badge_3_img: "/images/ourcenter/calicut/CBE-Center.png",
  ambassador_img: "/images/ourcenter/calicut/Mammootty-2048x1184.jpg",

  location_1_map:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3913.0624566!2d75.7912!3d11.2672!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba659387adf64ab%3A0x941a09a6c19dd9f5!2sElance%20Knowledge%20Tower%20(ACCA%20%7C%20CMA%20USA%20Institute)!5e0!3m2!1sen!2sin!4v1720000000000!5m2!1sen!2sin",
  location_1_name: "Elance Knowledge Tower",
  location_1_address: "Palazhi Road, Pottammal, Kozhikode, Kerala 673016",
  location_1_phone: "+ 91 98950 97070",
  location_1_email: "info@elancelearning.com",

  location_2_map:
    "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15652.434!2d75.816192!3d11.253261!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba65938b6f0aa33%3A0x941a09a6c19dd9f5!2sELANCE%20Kozhikode!5e0!3m2!1sen!2sus!4v1720000000001!5m2!1sen!2sus",
  location_2_name: "Audit Tower",
  location_2_address:
    "Metro Magna Building, Mavoor Rd, Parayancheri, Puthiyara, Kozhikode, Kerala 673016",
  location_2_phone: "+ 91 98950 97070",
  location_2_email: "info@elancelearning.com",

  cta_title: "India's Most<br />Trusted Commerce Institute",
  cta_desc:
    "With a commitment to excellence and industry-relevant training, we empower students with the knowledge, skills, and confidence to excel in global commerce. Join thousands of learners who trust us to shape their future.",
  cta_btn_text: "Register Now",

  pillar_1_img: "/images/ourcenter/calicut/Expert-mentors-300x200.jpg",
  pillar_1_title: "Learn",
  pillar_1_subtitle: "from the Best",
  pillar_1_desc:
    "Learning is built on strong academic structure, expert-led teaching, and continuous guidance here. With experienced faculty, personalised mentorship, regular assessments, and dedicated academic support, students develop the clarity, consistency, and confidence needed to excel. For students searching for the best commerce coaching in Calicut, Elance offers a focused and supportive academic environment.",

  pillar_2_img: "/images/ourcenter/calicut/image-11-300x200.jpg",
  pillar_2_title: "Grow",
  pillar_2_subtitle: "with Confidence",
  pillar_2_desc:
    "We focus on shaping students into confident, career-ready professionals through leadership programs, communication training, corporate grooming, and industry-focused skill development. From resume building to interview preparation, every initiative is designed to strengthen both professional presence and career readiness.",

  pillar_3_img: "",
  pillar_3_title: "Discover",
  pillar_3_subtitle: "Your True Path",
  pillar_3_desc:
    "Students explore their strengths through immersive practical learning experiences through our industry-focused student clubs, competitions, industry exposure, and student-driven activities. Initiatives like LEAP, EDGE, Excel Hackathon, and AuditLab help learners apply knowledge in real-world scenarios while discovering their interests and future direction.",

  pillar_4_img: "/images/ourcenter/calicut/Elan-festa-300x200.jpg",
  pillar_4_title: "Experience",
  pillar_4_subtitle: "the Journey",
  pillar_4_desc:
    "Life at Elance goes beyond classrooms to create a complete student experience. Through events, vibrant celebrations, industry interaction, placements, and a supportive campus environment, students become part of a vibrant learning ecosystem that prepares them for real-world success.",

  featured_title: 'We\'re <span class="text-blue">Featured</span> On',
  featured_subtitle:
    "Recognized by leading media houses for our commitment to quality education and student success.",
};

const KANNUR_DATA = {
  hero_video: "/images/ourcenter/calicut/Elance-Calicut.mp4",
  hero_eyebrow: "WELCOME TO THE",
  hero_title: "Best Commerce Institute<br />in Kannur",
  hero_desc:
    "Welcome to a world filled with energy, endless learning, and epic memories. At Elance Kannur, your career excels as you celebrate friendships, festivities, and every exciting moment in between!",
  hero_cta_1_text: "ACCA",
  hero_cta_1_link: "/acca",
  hero_cta_2_text: "CMA USA",
  hero_cta_2_link: "/cma",

  ecosystem_title: "A Complete Learning<br />Ecosystem",
  ecosystem_desc:
    "At Elance Kannur, education is an experience that goes beyond textbooks. We aim to create a supportive and inspiring space where students can learn, grow, and discover their full potential—both inside and outside the classroom.",
  badge_1_img: "/images/ourcenter/calicut/ACCA-Platinum.png",
  badge_2_img: "/images/ourcenter/calicut/Silver-CMA.png",
  badge_3_img: "/images/ourcenter/calicut/CBE-Center.png",
  ambassador_img: "/images/ourcenter/calicut/Mammootty-2048x1184.jpg",

  location_1_map_src:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3905.0!2d75.3704!3d11.8745!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba42101a7e8e021%3A0xaabbccdd!2sKannur%2C%20Kerala!5e0!3m2!1sen!2sin!4v1720000000004!5m2!1sen!2sin",
  location_1_name: "Elance Kannur Campus",
  location_1_address: "Elance Knowledge Centre, SM Street, Kannur, Kerala 670001",
  location_1_phone: "+ 91 98950 97070",
  location_1_email: "info@elancelearning.com",

  location_2_map_src:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3905.0!2d75.3804!3d11.8645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba42101a7e8e021%3A0xaabbccee!2sKannur%20Railway%20Station!5e0!3m2!1sen!2sin!4v1720000000005!5m2!1sen!2sin",
  location_2_name: "Elance Study Centre",
  location_2_address:
    "Elance Tower, Near Kannur Railway Station, Kannur, Kerala 670002",
  location_2_phone: "+ 91 98950 97070",
  location_2_email: "info@elancelearning.com",

  cta_title: "India's Most<br />Trusted Commerce Institute",
  cta_desc:
    "With a commitment to excellence and industry-relevant training, we empower students with the knowledge, skills, and confidence to excel in global commerce. Join thousands of learners who trust us to shape their future.",
  cta_button_text: "Register Now",

  pillar_1_img: "/images/ourcenter/calicut/Expert-mentors-300x200.jpg",
  pillar_1_title: "Learn",
  pillar_1_subtitle: "from the Best",
  pillar_1_desc:
    "Learning is built on strong academic structure, expert-led teaching, and continuous guidance here. With experienced faculty, personalised mentorship, regular assessments, and dedicated academic support, students develop the clarity, consistency, and confidence needed to excel. For students searching for the best commerce coaching in Kannur, Elance offers a focused and supportive academic environment.",

  pillar_2_img: "/images/ourcenter/calicut/image-11-300x200.jpg",
  pillar_2_title: "Grow",
  pillar_2_subtitle: "with Confidence",
  pillar_2_desc:
    "We focus on shaping students into confident, career-ready professionals through leadership programs, communication training, corporate grooming, and industry-focused skill development. From resume building to interview preparation, every initiative is designed to strengthen both professional presence and career readiness.",

  pillar_3_img: "",
  pillar_3_title: "Discover",
  pillar_3_subtitle: "Your True Path",
  pillar_3_desc:
    "Students explore their strengths through immersive practical learning experiences through our industry-focused student clubs, competitions, industry exposure, and student-driven activities. Initiatives like LEAP, EDGE, Excel Hackathon, and AuditLab help learners apply knowledge in real-world scenarios while discovering their interests and future direction.",

  pillar_4_img: "/images/ourcenter/calicut/Elan-festa-300x200.jpg",
  pillar_4_title: "Experience",
  pillar_4_subtitle: "the Journey",
  pillar_4_desc:
    "Life at Elance Kannur goes beyond classrooms to create a complete student experience. Through events, vibrant celebrations, industry interaction, placements, and a supportive campus environment, students become part of a vibrant learning ecosystem that prepares them for real-world success.",

  featured_title: 'We\'re <span class="text-blue">Featured</span> On',
  featured_subtitle:
    "Recognized by leading media houses for our commitment to quality education and student success.",
};

const KOCHI_DATA = {
  hero_video_src: "/images/ourcenter/calicut/Elance-Calicut.mp4",
  hero_eyebrow: "WELCOME TO THE",
  hero_title: "Best Commerce Institute<br />in Kochi",
  hero_desc:
    "Welcome to a world filled with energy, endless learning, and epic memories. At Elance Kochi, your career excels as you celebrate friendships, festivities, and every exciting moment in between!",
  hero_cta_1_text: "ACCA",
  hero_cta_1_link: "/acca",
  hero_cta_2_text: "CMA USA",
  hero_cta_2_link: "/cma",

  ecosystem_title: "A Complete Learning<br />Ecosystem",
  ecosystem_desc:
    "At Elance Kochi, education is an experience that goes beyond textbooks. We aim to create a supportive and inspiring space where students can learn, grow, and discover their full potential—both inside and outside the classroom.",
  badge_1_img: "/images/ourcenter/calicut/ACCA-Platinum.png",
  badge_2_img: "/images/ourcenter/calicut/Silver-CMA.png",
  badge_3_img: "/images/ourcenter/calicut/CBE-Center.png",
  ambassador_img: "/images/ourcenter/calicut/Mammootty-2048x1184.jpg",

  location_1_map_src:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.022!2d76.2711!3d10.0158!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b080d313bdddc85%3A0x2e9e88a8b7b48975!2sElance%20Kochi%20(ACCA%20%7C%20CMA%20USA%20Institute)!5e0!3m2!1sen!2sin!4v1720000000002!5m2!1sen!2sin",
  location_1_name: "Elance Kochi Campus",
  location_1_address: "Elance Knowledge Hub, MG Road, Ernakulam, Kochi, Kerala 682035",
  location_1_phone: "+ 91 98950 97070",
  location_1_email: "info@elancelearning.com",

  location_2_map_src:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.022!2d76.2911!3d10.0058!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b080cf0c1bc19a9%3A0x2e9e88a8b7b48975!2sPanampilly%20Nagar%2C%20Kochi!5e0!3m2!1sen!2sin!4v1720000000003!5m2!1sen!2sin",
  location_2_name: "Elance Study Centre",
  location_2_address: "Elance Tower, Panampilly Nagar, Ernakulam, Kochi, Kerala 682036",
  location_2_phone: "+ 91 98950 97070",
  location_2_email: "info@elancelearning.com",

  cta_title: "India's Most<br />Trusted Commerce Institute",
  cta_desc:
    "With a commitment to excellence and industry-relevant training, we empower students with the knowledge, skills, and confidence to excel in global commerce. Join thousands of learners who trust us to shape their future.",
  cta_btn_text: "Register Now",

  pillar_1_img: "/images/ourcenter/calicut/Expert-mentors-300x200.jpg",
  pillar_1_title: "Learn",
  pillar_1_subtitle: "from the Best",
  pillar_1_desc:
    "Learning is built on strong academic structure, expert-led teaching, and continuous guidance here. With experienced faculty, personalised mentorship, regular assessments, and dedicated academic support, students develop the clarity, consistency, and confidence needed to excel. For students searching for the best commerce coaching in Kochi, Elance offers a focused and supportive academic environment.",

  pillar_2_img: "/images/ourcenter/calicut/image-11-300x200.jpg",
  pillar_2_title: "Grow",
  pillar_2_subtitle: "with Confidence",
  pillar_2_desc:
    "We focus on shaping students into confident, career-ready professionals through leadership programs, communication training, corporate grooming, and industry-focused skill development. From resume building to interview preparation, every initiative is designed to strengthen both professional presence and career readiness.",

  pillar_3_img: "",
  pillar_3_title: "Discover",
  pillar_3_subtitle: "Your True Path",
  pillar_3_desc:
    "Students explore their strengths through immersive practical learning experiences through our industry-focused student clubs, competitions, industry exposure, and student-driven activities. Initiatives like LEAP, EDGE, Excel Hackathon, and AuditLab help learners apply knowledge in real-world scenarios while discovering their interests and future direction.",

  pillar_4_img: "/images/ourcenter/calicut/Elan-festa-300x200.jpg",
  pillar_4_title: "Experience",
  pillar_4_subtitle: "the Journey",
  pillar_4_desc:
    "Life at Elance Kochi goes beyond classrooms to create a complete student experience. Through events, vibrant celebrations, industry interaction, placements, and a supportive campus environment, students become part of a vibrant learning ecosystem that prepares them for real-world success.",

  featured_title: 'We\'re <span class="text-blue">Featured</span> On',
  featured_subtitle:
    "Recognized by leading media houses for our commitment to quality education and student success.",
};

const PAGE_DATA = {
  calicutcenter: CALICUT_DATA,
  kannurcenter: KANNUR_DATA,
  kochicenter: KOCHI_DATA,
};

const PAGE_TITLES = {
  calicutcenter: "Calicut Center Page",
  kannurcenter: "Kannur Center Page",
  kochicenter: "Kochi Center Page",
};

async function main() {
  console.log("Connecting to EmDash CMS at http://localhost:4321 ...");

  // ---------- 1. Create the union of fields on the 'pages' collection once ----------
  const pagesCollection = await client.collection("pages");
  const existingFieldSlugs = new Set(pagesCollection.fields.map((f) => f.slug));

  let addedFields = 0;
  for (const [slug, label, type] of NEW_FIELDS) {
    if (existingFieldSlugs.has(slug)) {
      console.log(`Field '${slug}' already exists — skipping.`);
      continue;
    }
    await client.createField("pages", { slug, type, label });
    existingFieldSlugs.add(slug);
    addedFields += 1;
    console.log(`Created field '${slug}' (${type}) — ${label}`);
  }
  console.log(`\nField setup complete: ${addedFields} new field(s) created, ${NEW_FIELDS.length - addedFields} already existed.\n`);

  // ---------- 2. Create/update the 3 center page rows ----------
  const { items } = await client.list("pages", { limit: 100 });

  for (const [slug, data] of Object.entries(PAGE_DATA)) {
    const existing = items.find((i) => i.slug === slug);
    if (existing) {
      await client.update("pages", existing.id, { data });
      await client.publish("pages", existing.id);
      console.log(`Updated existing 'pages' row for slug '${slug}' (id: ${existing.id}).`);
    } else {
      const created = await client.create("pages", {
        slug,
        data: { title: PAGE_TITLES[slug], ...data },
      });
      await client.publish("pages", created.id);
      console.log(`Created and published new 'pages' row for slug '${slug}' (id: ${created.id}).`);
    }
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
