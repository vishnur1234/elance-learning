/**
 * Migration: create the "gallery" collection in EmDash CMS from scratch,
 * seed its 15 photo rows, and wire the Gallery page's flat hero/featured
 * fields onto the shared "pages" collection (slug "gallery").
 *
 * Unlike scripts/migrate-acca-fields.js and scripts/migrate-banner-field.js
 * (which talk to Postgres directly via `pg`), this script goes through
 * EmDash's Node client library — the safe REST API with localhost-only
 * "dev bypass" auth — since the "gallery" collection doesn't exist yet and
 * we want schema + content creation to go through the normal EmDash paths.
 *
 * Requires a local Astro dev server already running at
 * http://localhost:4321, connected to the live database.
 *
 * Run with: node scripts/migrate-gallery-collection.js
 */

import { EmDashClient } from "emdash/client";

const client = new EmDashClient({ baseUrl: "http://localhost:4321", devBypass: true });

// The exact 15-item photo set currently hardcoded as GALLERY_DEFAULTS in
// src/pages/gallery.astro, verbatim.
const GALLERY_DEFAULTS = [
	{ image: "/images/gallery/DSC05995-scaled-1-1024x576.jpg", alt: "Placement Training – session 1", category: "all" },
	{ image: "/images/gallery/DSC05997-scaled-1-1024x576.jpg", alt: "Placement Training – session 2", category: "all" },
	{ image: "/images/gallery/DSC06004-scaled-1-1024x576.jpg", alt: "Placement Training – session 3", category: "all" },
	{ image: "/images/gallery/DSC06017-scaled-1-1024x576.jpg", alt: "Placement Training – session 4", category: "all" },
	{ image: "/images/gallery/DSC06029-scaled-1-1024x576.jpg", alt: "Placement Training – session 5", category: "all" },
	{ image: "/images/gallery/DSC06039-scaled-1-1024x576.jpg", alt: "Placement Training – session 6", category: "all" },
	{ image: "/images/gallery/DSC06040-scaled-1-1024x576.jpg", alt: "Placement Training – session 7", category: "all" },
	{ image: "/images/gallery/DSC06043-scaled-1-1024x576.jpg", alt: "Placement Training – session 8", category: "all" },
	{ image: "/images/gallery/DSC06073-scaled-1-1024x683.jpg", alt: "Placement Training – session 9", category: "all" },
	{ image: "/images/gallery/DSC06074-scaled-1-1024x683.jpg", alt: "Placement Training – session 10", category: "all" },
	{ image: "/images/gallery/DSC06076-scaled-1.jpg", alt: "Placement Training – session 11", category: "all" },
	{ image: "/images/gallery/DSC06082-scaled-1.jpg", alt: "Placement Training – session 12", category: "all" },
	{ image: "/images/gallery/DSC06090-scaled-1.jpg", alt: "Placement Training – session 13", category: "all" },
	{ image: "/images/gallery/DSC06095-scaled-1.jpg", alt: "Placement Training – session 14", category: "all" },
	{ image: "/images/gallery/DSC06107-scaled-1-1024x576.jpg", alt: "Placement Training – session 15", category: "all" },
];

// [slug, type, label] — matches src/pages/gallery.astro's expected shape:
// e.data.image / e.data.alt / e.data.category
const GALLERY_FIELDS = [
	["image", "image", "Image"],
	["alt", "string", "Alt Text"],
	["category", "string", "Category"],
];

// The Gallery page's flat hero/featured fields on the shared "pages"
// collection (slug "gallery"), and their literal fallback values as they
// currently appear in src/pages/gallery.astro.
const PAGES_FIELDS = [
	["hero_title", "string", "Hero Title"],
	["hero_desc", "text", "Hero Description"],
	["featured_title", "string", "Featured Section Title"],
	["featured_subtitle", "string", "Featured Section Subtitle"],
];

const GALLERY_PAGE_VALUES = {
	hero_title: "Life At Elance",
	hero_desc:
		"Elance, India's premium commerce platform, excels in delivering esteemed professional accounting courses, such as ACCA & CMA USA. Supported by a team of highly skilled educators, our platform's core ethos revolves around accessibility and excellence in commerce education. Our remarkable growth trajectory, surging from 22 students in 2018 to nurturing a global cohort exceeding 25,000, is a testament to our unwavering dedication to providing exceptional educational opportunities. Elance proudly stands as the foremost platform for those seeking top-tier finance certifications and a comprehensive learning experience in commerce.",
	featured_title: 'We\'re <span class="text-blue">Featured</span> On',
	featured_subtitle:
		"Recognized by leading media houses for our commitment to quality education and student success.",
};

async function main() {
	console.log("Connecting to EmDash CMS at http://localhost:4321 (dev bypass)...");

	// ---------- 1. Create the "gallery" collection if it doesn't exist ----------
	const collections = await client.collections();
	if (!collections.some((c) => c.slug === "gallery")) {
		await client.createCollection({
			slug: "gallery",
			label: "Gallery",
			labelSingular: "Gallery Photo",
		});
		console.log('Created "gallery" collection.');
	} else {
		console.log('"gallery" collection already exists.');
	}

	// ---------- 2. Create the gallery collection's fields if missing ----------
	const galleryCollection = await client.collection("gallery");
	const existingGalleryFields = new Set(galleryCollection.fields.map((f) => f.slug));
	let addedGalleryFields = 0;
	for (const [slug, type, label] of GALLERY_FIELDS) {
		if (!existingGalleryFields.has(slug)) {
			await client.createField("gallery", { slug, type, label });
			addedGalleryFields += 1;
			console.log(`Added "gallery" field: ${slug} (${type}).`);
		} else {
			console.log(`"gallery" field "${slug}" already exists.`);
		}
	}
	console.log(`Added ${addedGalleryFields} new field(s) to "gallery".`);

	// ---------- 3. Seed the 15 rows (idempotent: skip if already seeded) ----------
	const { items: existingItems } = await client.list("gallery", { limit: 50 });
	if (existingItems.length === 0) {
		let seeded = 0;
		for (const item of GALLERY_DEFAULTS) {
			const created = await client.create("gallery", { data: item });
			await client.publish("gallery", created.id);
			seeded += 1;
		}
		console.log(`Seeded ${seeded} gallery photo row(s).`);
	} else {
		console.log(`"gallery" collection already has ${existingItems.length} row(s) — skipping seed.`);
	}

	// ---------- 4. Wire the flat hero/featured fields onto "pages" ----------
	const pagesCollection = await client.collection("pages");
	const existingPagesFields = new Set(pagesCollection.fields.map((f) => f.slug));
	let addedPagesFields = 0;
	for (const [slug, type, label] of PAGES_FIELDS) {
		if (!existingPagesFields.has(slug)) {
			await client.createField("pages", { slug, type, label });
			addedPagesFields += 1;
			console.log(`Added "pages" field: ${slug} (${type}).`);
		} else {
			console.log(`"pages" field "${slug}" already exists.`);
		}
	}
	console.log(`Added ${addedPagesFields} new field(s) to "pages".`);

	// ---------- 5. Create/update the "pages" row for slug "gallery" ----------
	const { items: pagesItems } = await client.list("pages", { limit: 100 });
	const galleryPageRow = pagesItems.find((item) => item.slug === "gallery");

	if (galleryPageRow) {
		await client.update("pages", galleryPageRow.id, { data: GALLERY_PAGE_VALUES });
		await client.publish("pages", galleryPageRow.id);
		console.log('Updated existing "pages" row for slug "gallery".');
	} else {
		const created = await client.create("pages", {
			slug: "gallery",
			data: { title: "Gallery Page", ...GALLERY_PAGE_VALUES },
		});
		await client.publish("pages", created.id);
		console.log('Created and published new "pages" row for slug "gallery".');
	}

	console.log("\nDone!");
}

main().catch((err) => {
	console.error("Error:", err.message);
	process.exit(1);
});
