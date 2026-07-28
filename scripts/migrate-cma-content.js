/**
 * Migration: wire up the CMA page (cma.astro + CmaFaculties.astro +
 * CmaLearningAndSyllabus.astro) for full EmDash CMS editing.
 *
 * All three files read from the same "pages" collection row (slug "cma"),
 * passed in as `entry={cmaPage}`. Several field names follow the exact same
 * naming convention already introduced by the ACCA migration
 * (scripts/migrate-acca-fields.js) — e.g. faculties_title, faculty_N_name/
 * qual/photo, feature_N_title/desc, syllabus_title/desc, syllabus_N_label/
 * intro/checklist, learning_title, proof_label, hero_heading — since
 * AccaFaculties/AccaLearningAndSyllabus use identical field slugs. Those
 * fields likely already exist on the 'pages' collection schema; this script
 * checks the live schema via the EmDash client and only creates fields that
 * are actually missing. Every field's VALUE is still set on the 'cma' row
 * regardless, since each row holds its own independent values.
 *
 * Uses EmDash's Node client library (safe REST API + dev-bypass auth,
 * localhost-only) — no raw SQL, no direct DB access.
 *
 * IMPORTANT: banner_text already exists on the live 'cma' row from an
 * earlier migration (scripts/migrate-banner-field.js) and must NOT be
 * touched — it is intentionally excluded from both the field list and the
 * update payload below.
 *
 * Run with: node scripts/migrate-cma-content.js
 */

import { EmDashClient } from "emdash/client";

const client = new EmDashClient({ baseUrl: "http://localhost:4321", devBypass: true });

// ---------------------------------------------------------------------------
// Field definitions: [slug, type, label]
// type: string (short/HTML text), text (long prose), image (plain path
// string value, not JSON-encoded).
// ---------------------------------------------------------------------------

const NEW_FIELDS = [
	// ── cma.astro: hero section ──
	["hero_heading", "string", "CMA Hero Heading"],
	["hero_badge_gold_img", "image", "CMA Hero Gold Badge Image"],
	["hero_badge_hock_img", "image", "CMA Hero HOCK Badge Image"],
	["hero_badge_ima_img", "image", "CMA Hero IMA Badge Image"],
	["ima_logo_img", "image", "CMA IMA Authorized Logo Image"],
	["proof_label", "string", "Hero Trust Proof Label"],
];
for (let n = 1; n <= 6; n++) {
	NEW_FIELDS.push([`avatar_${n}_img`, "image", `Avatar ${n} Image`]);
}
NEW_FIELDS.push(["corp_logo_1_text", "string", "Corporate Logo 1 Text"]);
NEW_FIELDS.push(["corp_logo_2_img", "image", "Corporate Logo 2 Image"]);
NEW_FIELDS.push(["corp_logo_3_text", "string", "Corporate Logo 3 Text"]);
NEW_FIELDS.push(["corp_logo_4_text", "string", "Corporate Logo 4 Text"]);
NEW_FIELDS.push(["corp_logo_5_img", "image", "Corporate Logo 5 Image"]);
NEW_FIELDS.push(["hero_video_url", "string", "CMA Hero Video URL"]);

// ── cma.astro: achievement stat cards ──
for (let n = 1; n <= 5; n++) {
	NEW_FIELDS.push([`achievement_${n}_num`, "string", `Achievement ${n} Number`]);
	NEW_FIELDS.push([`achievement_${n}_label`, "string", `Achievement ${n} Label`]);
}

// ── cma.astro: "Be the Professional" section ──
NEW_FIELDS.push(["professional_title", "string", "Be The Professional Section Title"]);
NEW_FIELDS.push(["professional_badge_1_img", "image", "Professional Badge 1 Image"]);
NEW_FIELDS.push(["professional_badge_2_img", "image", "Professional Badge 2 Image"]);
for (let n = 1; n <= 5; n++) {
	NEW_FIELDS.push([`bullet_${n}_text`, "text", `Bullet ${n} Text`]);
}

// ── CmaFaculties.astro ──
NEW_FIELDS.push(["faculties_title", "string", "Faculties Section Title"]);
for (let n = 1; n <= 7; n++) {
	NEW_FIELDS.push([`faculty_${n}_name`, "string", `Faculty ${n} Name`]);
	NEW_FIELDS.push([`faculty_${n}_qual`, "string", `Faculty ${n} Qualification`]);
	NEW_FIELDS.push([`faculty_${n}_photo`, "image", `Faculty ${n} Photo`]);
}

// ── CmaLearningAndSyllabus.astro ──
NEW_FIELDS.push(["learning_title", "string", "Learning Experience Section Title"]);
for (let n = 1; n <= 8; n++) {
	NEW_FIELDS.push([`feature_${n}_title`, "string", `Feature ${n} Title`]);
	NEW_FIELDS.push([`feature_${n}_desc`, "text", `Feature ${n} Description`]);
}
NEW_FIELDS.push(["syllabus_title", "string", "Syllabus Section Title"]);
NEW_FIELDS.push(["syllabus_desc", "text", "Syllabus Section Description"]);
for (let n = 1; n <= 2; n++) {
	NEW_FIELDS.push([`syllabus_${n}_label`, "string", `Syllabus Item ${n} Label`]);
	NEW_FIELDS.push([`syllabus_${n}_intro`, "text", `Syllabus Item ${n} Intro`]);
	NEW_FIELDS.push([`syllabus_${n}_checklist`, "text", `Syllabus Item ${n} Checklist (one per line)`]);
}

// ---------------------------------------------------------------------------
// Values to set on the 'cma' row. Do NOT include banner_text here — it's
// already set from an earlier migration and client.update() only
// merges/sets the keys we pass, so omitting it leaves it untouched.
// ---------------------------------------------------------------------------

const CMA_PAGE_VALUES = {
	// Hero section
	hero_heading:
		'Transform your<br />career and lead the<br />finance world with<br /><span class="text-blue">CMA USA.</span>',
	hero_badge_gold_img: "/images/CMA-gold-1-e1762840636945.png",
	hero_badge_hock_img: "/images/courses/Hock.png",
	hero_badge_ima_img: "/images/aswathi-CMA.jpg",
	ima_logo_img: "/images/courses/Silver-CMA.png",
	proof_label:
		'TRUSTED BY OVER <span class="highlight-blue">25000</span><br />STUDENTS GLOBALLY FOR EXCELLENCE!',

	avatar_1_img: "/images/Ajsal-E.webp",
	avatar_2_img: "/images/Anuradha.webp",
	avatar_3_img: "/images/Bijini-Koshi.webp",
	avatar_4_img: "/images/Jishana-T.webp",
	avatar_5_img: "/images/Kashinath.webp",
	avatar_6_img: "/images/Thanha-Kadeeja-K.webp",

	corp_logo_1_text: "e.",
	corp_logo_2_img: "/images/pwc.png",
	corp_logo_3_text: "Infosys",
	corp_logo_4_text: "KPMG",
	corp_logo_5_img: "/images/deloitte.png",

	hero_video_url:
		"https://www.youtube.com/embed/fSmpRKXSJS0?autoplay=1&mute=1&loop=1&playlist=fSmpRKXSJS0&start=5",

	// Achievement stat cards
	achievement_1_num: "5", achievement_1_label: "Years",
	achievement_2_num: "49", achievement_2_label: "World Ranks",
	achievement_3_num: "76", achievement_3_label: "National Ranks",
	achievement_4_num: "5000+", achievement_4_label: "Affiliates",
	achievement_5_num: "25,000", achievement_5_label: "Students",

	// "Be the Professional" section
	professional_title:
		'Be the <span class="text-slate">Professional</span> the<br />World Is <span class="text-slate">Looking For!</span>',
	professional_badge_1_img: "/images/CMA-gold-1-e1762840636945.png",
	professional_badge_2_img: "/images/courses/Silver-CMA.png",
	bullet_1_text: "Recognition in over 160 countries world-wide.",
	bullet_2_text: "Join a network of influential finance professionals.",
	bullet_3_text: "Stay in demand with skills valued internationally.",
	bullet_4_text: "Upskill your way to a leadership role in the finance industry.",
	bullet_5_text: "High earning potential from ₹4 LPA to ₹20LPA.",

	// CmaFaculties.astro
	faculties_title: 'Our <span class="text-blue">CMA</span> Faculties',
	faculty_1_name: "Hijas Hashim", faculty_1_qual: "CMA, M COM", faculty_1_photo: "/images/cmaFaculty/Faculty_CMA-USA-Website-Template-01-1024x768-1.jpg",
	faculty_2_name: "Sangeetha Ajit", faculty_2_qual: "CFA, CMA", faculty_2_photo: "/images/cmaFaculty/Faculty_CMA-USA-Website-Template-02-1024x768-1.jpg",
	faculty_3_name: "Mohamed safeeque Ali", faculty_3_qual: "CMA, M.com", faculty_3_photo: "/images/cmaFaculty/Faculty_CMA-USA-Website-Template-03-1024x768-1.jpg",
	faculty_4_name: "Mithun Roy", faculty_4_qual: "CMA", faculty_4_photo: "/images/cmaFaculty/Faculty_CMA-USA-Website-Template-05-1024x768-1.jpg",
	faculty_5_name: "M. Nihad Jaseen", faculty_5_qual: "CMA Qualified", faculty_5_photo: "/images/cmaFaculty/Faculty_CMA-USA-Website-Template-06-1024x768-1.jpg",
	faculty_6_name: "Rahul RS", faculty_6_qual: "ACCA", faculty_6_photo: "/images/cmaFaculty/Faculty-Website-Template-11-1024x768-1.jpg",
	faculty_7_name: "Junaid KP", faculty_7_qual: "CMA", faculty_7_photo: "/images/cmaFaculty/Junaid-KP-Faculty-Website-Template-16.jpg",

	// CmaLearningAndSyllabus.astro
	learning_title:
		'<strong>Exceptional</strong> <span class="text-blue">Elance Learning<br />Experience!</span>',
	feature_1_title: "World Class Faculties", feature_1_desc: "Elance is distinguished by its exceptional faculty of experts, guaranteeing effective teaching methods. We take pride in providing exceptional guidance and support to our students through every aspect of their courses.",
	feature_2_title: "Excellent Learning Experience", feature_2_desc: "Elance offers a calm campus where students can learn peacefully from expert teachers. We also focus on co-curricular activities that support personal and social development.",
	feature_3_title: "Holistic Guidance", feature_3_desc: "At Elance, students don't have to rely solely on faculty. They also receive support from top-ranked mentors, coordinators, and a learning app, creating a complete ecosystem for comprehensive preparation.",
	feature_4_title: "Hands on Approach", feature_4_desc: "With a hands-on approach to learning, Elance provides opportunities for practical application, allowing you to reinforce your understanding and develop practical skills that employers value.",
	feature_5_title: "Top-Tier Placement Assistance", feature_5_desc: "Elance prepares students not just for the industry but equips them with essential skills for excellence. Our focus ensures they are ready for successful placements and stand out as professionals.",
	feature_6_title: "Astonishing Infrastructure", feature_6_desc: "At Elance, every student receives personalized attention to gain an edge in professional commerce exams. Our campuses offer an integrated learning approach supported by advanced technology and top-notch facilities.",
	feature_7_title: "Accessibility from Anywhere Anytime", feature_7_desc: "Our learning app allows students to study anytime, anywhere. By offering comprehensive resources for their courses, the Elance Learning App simplifies their educational experience.",
	feature_8_title: "Hostel & Transportation Facility", feature_8_desc: "We at Elance offers convenient hostel facilities and reliable transportation services, ensuring students enjoy a safe, comfortable, and hassle-free learning journey tailored to their needs.",

	syllabus_title: '<span class="text-blue">Course</span> Syllabus',
	syllabus_desc:
		"The US CMA certification consists of two exam parts, testing critical management accounting and financial planning skills. Each part is tested via a 4-hour exam containing 100 MCQs and 2 scenario-based essay questions.",
	syllabus_1_label: "Part 1: Financial Planning, Performance, and Analytics",
	syllabus_1_intro: "Part 1 of the US CMA program covers the critical internal operations of financial control, budgeting, forecasting, cost management, internal controls, and technology/analytics.",
	syllabus_1_checklist: "Planning, Budgeting, and Forecasting (20%)\nPerformance Management (20%)\nExternal Financial Reporting Decisions (15%)\nCost Management (15%)\nInternal Controls (15%)\nTechnology and Analytics (15%)",
	syllabus_2_label: "Part 2: Strategic Financial Management",
	syllabus_2_intro: "Part 2 focuses on strategic corporate finance decisions, financial statement analysis, risk management, investment decisions, decision analysis, and professional ethics.",
	syllabus_2_checklist: "Decision Analysis (25%)\nFinancial Statement Analysis (20%)\nCorporate Finance (20%)\nProfessional Ethics (15%)\nRisk Management (10%)\nInvestment Decisions (10%)",
};

async function main() {
	console.log("Connecting to EmDash at http://localhost:4321 (dev bypass)...");

	console.log("Fetching 'pages' collection schema...");
	const pagesCollection = await client.collection("pages");
	const existingFieldSlugs = new Set(pagesCollection.fields.map((f) => f.slug));
	console.log(`'pages' collection currently has ${existingFieldSlugs.size} fields.`);

	let created = 0;
	let skipped = 0;
	for (const [slug, type, label] of NEW_FIELDS) {
		if (existingFieldSlugs.has(slug)) {
			skipped += 1;
			continue;
		}
		await client.createField("pages", { slug, type, label });
		existingFieldSlugs.add(slug);
		created += 1;
		console.log(`  + created field: ${slug} (${type})`);
	}
	console.log(`Fields: ${created} created, ${skipped} already existed (skipped).`);

	console.log("Looking up 'cma' row in 'pages' collection...");
	const { items } = await client.list("pages", { limit: 100 });
	const cmaRow = items.find((i) => i.slug === "cma");
	if (!cmaRow) {
		throw new Error("cma row not found — expected it to already exist");
	}

	console.log(`Updating 'cma' row (id=${cmaRow.id}) with ${Object.keys(CMA_PAGE_VALUES).length} field values (banner_text left untouched)...`);
	await client.update("pages", cmaRow.id, { data: CMA_PAGE_VALUES });

	console.log("\nDone! CMA page content migrated.");
}

main().catch((err) => {
	console.error("Error:", err.message);
	process.exit(1);
});
