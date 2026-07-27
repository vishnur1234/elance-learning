/**
 * Migration: Add missing fields to the 'pages' collection in the PostgreSQL database.
 * 
 * The seed.json has all the fields, but the PostgreSQL database only has the first 16.
 * This script adds the missing ones (courses_title, course_1_title, etc.).
 * 
 * Run with: node scripts/migrate-pg-fields.js
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Load env
const envContent = readFileSync('.env', 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  envVars[key] = val;
}

const DATABASE_URL = envVars.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL });

// Fields to add (from seed.json pages collection, excluding the first 16 that already exist)
// Format: [slug, label, type, sort_order]
const MISSING_FIELDS = [
  ['courses_title', 'Courses Section Title', 'string', 16],
  ['course_1_title', 'Course 1 Title', 'string', 17],
  ['course_1_desc', 'Course 1 Description', 'text', 18],
  ['course_1_btn_primary', 'Course 1 Primary Button', 'string', 19],
  ['course_1_btn_secondary', 'Course 1 Secondary Button', 'string', 20],
  ['course_2_title', 'Course 2 Title', 'string', 21],
  ['course_2_desc', 'Course 2 Description', 'text', 22],
  ['course_2_btn_primary', 'Course 2 Primary Button', 'string', 23],
  ['course_2_btn_secondary', 'Course 2 Secondary Button', 'string', 24],
  ['steps_title', 'Steps Section Title', 'string', 25],
  ['step_1_num', 'Step 1 Number', 'string', 26],
  ['step_1_label', 'Step 1 Label', 'string', 27],
  ['step_2_num', 'Step 2 Number', 'string', 28],
  ['step_2_label', 'Step 2 Label', 'string', 29],
  ['step_3_num', 'Step 3 Number', 'string', 30],
  ['step_3_label', 'Step 3 Label', 'string', 31],
  ['steps_cta_text', 'Steps CTA Text', 'string', 32],
  ['testimonials_eyebrow', 'Testimonials Eyebrow', 'string', 33],
  ['testimonials_title', 'Testimonials Section Title', 'string', 34],
  ['testimonials_desc', 'Testimonials Section Description', 'text', 35],
  ['testimonials_btn_text', 'Testimonials Button Text', 'string', 36],
  ['testimonial_1_badge', 'Testimonial 1 Badge', 'string', 37],
  ['testimonial_1_quote', 'Testimonial 1 Quote', 'text', 38],
  ['testimonial_1_name', 'Testimonial 1 Name', 'string', 39],
  ['testimonial_1_role', 'Testimonial 1 Role', 'string', 40],
  ['testimonial_2_badge', 'Testimonial 2 Badge', 'string', 41],
  ['testimonial_2_quote', 'Testimonial 2 Quote', 'text', 42],
  ['testimonial_2_name', 'Testimonial 2 Name', 'string', 43],
  ['testimonial_2_role', 'Testimonial 2 Role', 'string', 44],
  ['audience_1_overlay', 'Audience 1 Overlay Text', 'string', 45],
  ['audience_1_title', 'Audience 1 Title', 'string', 46],
  ['audience_1_desc', 'Audience 1 Description', 'text', 47],
  ['audience_1_btn_text', 'Audience 1 Button Text', 'string', 48],
  ['audience_2_overlay', 'Audience 2 Overlay Text', 'string', 49],
  ['audience_2_title', 'Audience 2 Title', 'string', 50],
  ['audience_2_desc', 'Audience 2 Description', 'text', 51],
  ['audience_2_btn_text', 'Audience 2 Button Text', 'string', 52],
  ['promo_title', 'Promo Banner Title', 'string', 53],
  ['promo_btn_text', 'Promo Banner Button Text', 'string', 54],
  ['feedback_1_name', 'Feedback 1 Student Name', 'string', 55],
  ['feedback_1_role', 'Feedback 1 Student Role', 'string', 56],
  ['feedback_2_name', 'Feedback 2 Student Name', 'string', 57],
  ['feedback_2_role', 'Feedback 2 Student Role', 'string', 58],
  ['feedback_3_name', 'Feedback 3 Student Name', 'string', 59],
  ['feedback_3_role', 'Feedback 3 Student Role', 'string', 60],
  ['feedback_4_name', 'Feedback 4 Student Name', 'string', 61],
  ['feedback_4_role', 'Feedback 4 Student Role', 'string', 62],
  ['feedback_5_name', 'Feedback 5 Student Name', 'string', 63],
  ['feedback_5_role', 'Feedback 5 Student Role', 'string', 64],
  ['feedback_6_name', 'Feedback 6 Student Name', 'string', 65],
  ['feedback_6_role', 'Feedback 6 Student Role', 'string', 66],
  ['think_banner_title', 'Think Banner Title', 'string', 67],
  ['think_1_quote', 'Think Banner Testimonial 1 Quote', 'text', 68],
  ['think_1_name', 'Think Banner Testimonial 1 Name', 'string', 69],
  ['think_1_company', 'Think Banner Testimonial 1 Company', 'string', 70],
  ['think_2_quote', 'Think Banner Testimonial 2 Quote', 'text', 71],
  ['think_2_name', 'Think Banner Testimonial 2 Name', 'string', 72],
  ['think_2_company', 'Think Banner Testimonial 2 Company', 'string', 73],
  ['think_3_quote', 'Think Banner Testimonial 3 Quote', 'text', 74],
  ['think_3_name', 'Think Banner Testimonial 3 Name', 'string', 75],
  ['think_3_company', 'Think Banner Testimonial 3 Company', 'string', 76],
  ['achievements_title', 'Achievements Title', 'string', 77],
  ['achievements_subtitle', 'Achievements Subtitle', 'text', 78],
  ['achievements_1_num', 'Achievement 1 Number', 'string', 79],
  ['achievements_1_label', 'Achievement 1 Label', 'string', 80],
  ['achievements_2_num', 'Achievement 2 Number', 'string', 81],
  ['achievements_2_label', 'Achievement 2 Label', 'string', 82],
  ['career_title', 'Career Section Title', 'string', 83],
  ['partner_1_name', 'Partner 1 Name', 'string', 84],
  ['partner_1_desc', 'Partner 1 Description', 'text', 85],
  ['partner_2_name', 'Partner 2 Name', 'string', 86],
  ['partner_2_desc', 'Partner 2 Description', 'text', 87],
  ['partner_3_name', 'Partner 3 Name', 'string', 88],
  ['partner_3_desc', 'Partner 3 Description', 'text', 89],
  ['partner_4_name', 'Partner 4 Name', 'string', 90],
  ['partner_4_desc', 'Partner 4 Description', 'text', 91],
  ['life_title', 'Life Title', 'string', 92],
  ['life_1_title', 'Life Card 1 Title', 'string', 93],
  ['life_1_desc', 'Life Card 1 Description', 'text', 94],
  ['life_2_title', 'Life Card 2 Title', 'string', 95],
  ['life_2_desc', 'Life Card 2 Description', 'text', 96],
  ['life_3_title', 'Life Card 3 Title', 'string', 97],
  ['life_3_desc', 'Life Card 3 Description', 'text', 98],
  ['life_4_title', 'Life Card 4 Title', 'string', 99],
  ['life_4_desc', 'Life Card 4 Description', 'text', 100],
  ['featured_title', 'Featured Section Title', 'string', 101],
  ['featured_subtitle', 'Featured Section Subtitle', 'text', 102],
];

// Map field types to column_type (matches emdash schema types)
function getColumnType(type) {
  if (type === 'text') return 'text';
  if (type === 'portableText') return 'jsonb';
  if (type === 'image') return 'jsonb';
  if (type === 'number') return 'numeric';
  if (type === 'boolean') return 'boolean';
  if (type === 'datetime') return 'timestamptz';
  if (type === 'url') return 'text';
  return 'text'; // default for string
}

// Generate ULID-like ID
function generateId() {
  const now = Date.now();
  const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let id = '';
  // Timestamp part (10 chars)
  let ts = now;
  for (let i = 9; i >= 0; i--) {
    id = chars[ts % 32] + id;
    ts = Math.floor(ts / 32);
  }
  // Random part (16 chars)
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * 32)];
  }
  return '01' + id.slice(0, 24);
}

async function main() {
  console.log('Connecting to PostgreSQL...');
  await client.connect();
  console.log('Connected!');

  // Get the pages collection ID
  const colResult = await client.query(
    "SELECT id FROM _emdash_collections WHERE slug = 'pages'"
  );
  if (colResult.rows.length === 0) {
    console.error('Pages collection not found in PostgreSQL!');
    process.exit(1);
  }
  const collectionId = colResult.rows[0].id;
  console.log('Pages collection ID:', collectionId);

  // Get existing fields
  const existingResult = await client.query(
    "SELECT slug FROM _emdash_fields WHERE collection_id = $1",
    [collectionId]
  );
  const existingSlugs = new Set(existingResult.rows.map(r => r.slug));
  console.log('Existing fields:', [...existingSlugs]);

  // Add missing fields
  let addedCount = 0;
  for (const [slug, label, type, sortOrder] of MISSING_FIELDS) {
    if (existingSlugs.has(slug)) {
      console.log(`  Skipping (already exists): ${slug}`);
      continue;
    }
    
    const id = generateId();
    const columnType = getColumnType(type);
    
    await client.query(
      `INSERT INTO _emdash_fields (id, collection_id, slug, label, type, column_type, required, "unique", sort_order, created_at, translatable)
       VALUES ($1, $2, $3, $4, $5, $6, false, false, $7, NOW(), true)
       ON CONFLICT (collection_id, slug) DO NOTHING`,
      [id, collectionId, slug, label, type, columnType, sortOrder]
    );
    console.log(`  Added: ${slug} (${type})`);
    addedCount++;
  }

  console.log(`\n✅ Done! Added ${addedCount} new fields to the 'pages' collection.`);
  
  // Also need to add the data for the home page entry
  // First, check if home page exists and get its ID
  const homePageResult = await client.query(
    "SELECT id FROM ec_pages WHERE slug = 'home' LIMIT 1"
  );
  
  if (homePageResult.rows.length > 0) {
    const homeId = homePageResult.rows[0].id;
    console.log('\nFound home page entry:', homeId);
    
    // Get current data
    const currentDataResult = await client.query(
      "SELECT data FROM ec_pages WHERE id = $1",
      [homeId]
    );
    const currentData = currentDataResult.rows[0]?.data || {};
    
    // Fields to populate with default values
    const newData = {
      courses_title: 'Pick the <span class="text-blue">Course</span> That Fits<br class="life-mobile-br" /> Your Dream',
      course_1_title: 'ACCA',
      course_1_desc: 'Qualify for ACCA and get access to the world of professional accounting which gives an offer to work globally across 180+ countries with high demand and good remuneration.',
      course_1_btn_primary: 'Brochure',
      course_1_btn_secondary: 'Know more',
      course_2_title: 'CMA USA',
      course_2_desc: 'Skill up your current working career by becoming a Certified Management Accountant and feel the advancement of professional accounting.',
      course_2_btn_primary: 'Brochure',
      course_2_btn_secondary: 'Know more',
      steps_title: 'Your <span class="text-blue">Commerce Career</span> Starts Here',
      step_1_num: '01',
      step_1_label: 'Learn',
      step_2_num: '02',
      step_2_label: 'Perform',
      step_3_num: '03',
      step_3_label: 'Get A Job',
      steps_cta_text: 'Reach Us Anytime',
      testimonials_eyebrow: 'Testimonials',
      testimonials_title: '<span class="text-blue">Hear From</span> Our<br />Previous <span class="text-blue">Students</span>',
      testimonials_desc: 'Elance envisions the courses for everyone to fuel the advancement of skills and make you capable of conquering your dream career',
      testimonials_btn_text: 'View More',
      testimonial_1_badge: 'CA',
      testimonial_1_quote: '"All my papers were done online at Elance, with wonderful support from the faculty and staff. "',
      testimonial_1_name: 'Anagha Anand',
      testimonial_1_role: 'Elance CA Student',
      testimonial_2_badge: 'ACCA',
      testimonial_2_quote: '"Elance\'s online ACCA course and placement drive helped me get a job at EY."',
      testimonial_2_name: 'Abhiram',
      testimonial_2_role: 'ACCA',
      audience_1_overlay: '<span class="label-light">For</span><br />Students',
      audience_1_title: 'For Students',
      audience_1_desc: 'Offering top-tier commerce professional courses like ACCA and CMA to propel you into the future of finance with high-paying global career opportunities',
      audience_1_btn_text: 'Get Started',
      audience_2_overlay: '<span class="label-light">For</span> Working<br />Professionals',
      audience_2_title: 'For Working Professionals',
      audience_2_desc: 'Our flexible learning solutions—online, offline, and hybrid, are designed for working professionals, to empower and enhance your knowledge and skills, and achieve new career heights.',
      audience_2_btn_text: 'Get Started',
      promo_title: 'Make the Smart Move for a<br />Commerce Career<br />That Matters!',
      promo_btn_text: 'Download Brochure',
      feedback_1_name: 'Kasinath',
      feedback_1_role: 'Elance CA Student',
      feedback_2_name: 'Anaam Abdul Salam',
      feedback_2_role: 'Elance ACCA Student',
      feedback_3_name: 'Ann Mary',
      feedback_3_role: 'Elance CMA Student',
      feedback_4_name: 'Anuradha',
      feedback_4_role: 'Elance CA Student',
      feedback_5_name: 'Ayshath Shahma',
      feedback_5_role: 'Elance ACCA Student',
      feedback_6_name: 'Bijini Koshi',
      feedback_6_role: 'Elance CMA Student',
      think_banner_title: 'What our <span class="text-blue">Students<br />think</span> about us?',
      think_1_quote: '"With Elance, you won\'t feel like you\'re missing out on the college vibe."',
      think_1_name: 'Shringa Surendran',
      think_1_company: 'KPMG',
      think_2_quote: '"Flexible classes and amazing mock exams. Elance is the best choice for professional finance courses."',
      think_2_name: 'Anagha Anand',
      think_2_company: 'Deloitte',
      think_3_quote: '"The placement support and faculty mentoring at Elance are unmatched in professional coaching."',
      think_3_name: 'Abhiram',
      think_3_company: 'EY',
      achievements_title: 'Achievements',
      achievements_subtitle: "With immense pride, we underscore our outstanding results, a testament to Elance's legacy since its inception. In just four years, Elance has consistently delivered unmatched results, guiding students towards their dream careers as top-class commerce professionals. These achievements aren't just milestones; they represent our unwavering dedication to nurturing the future leaders of the industry.",
      achievements_1_num: '53',
      achievements_1_label: 'World Ranks',
      achievements_2_num: '80',
      achievements_2_label: 'National Ranks',
      career_title: 'Begin Your <span class="text-blue">Dream Career</span><br />with Us',
      partner_1_name: 'Platinum Approved Partner of ACCA',
      partner_1_desc: "Elance Proudly stands as one of the top Platinum Approved Partners of ACCA, a testament to our exceptional commitment to top-tier accounting education and excellent academic standards.",
      partner_2_name: 'Gold CMA Course Provider approved by IMA',
      partner_2_desc: "Highlighting a commitment to excellence in management accounting education, Elance is being recognised as a Gold CMA Course Provider approved by IMA.",
      partner_3_name: 'ACCA Approved CBE Centre',
      partner_3_desc: "Elance is an ACCA-approved CBE Centre. This license grants our campus the authorization to conduct ACCA fundamentals at our Calicut campus itself..",
      partner_4_name: 'Approved Partner of HOCK INTERNATIONAL',
      partner_4_desc: "Hock International for CMA USA collaborates closely with Elance, ensuring top-notch instruction using authentic learning materials supporting guidance to conquer doubts, master the syllabus, and excel in certification exams.",
      life_title: 'Life at <span class="text-blue">Elance</span>',
      life_1_title: "Launch of 'CMA'",
      life_1_desc: 'An awesome event for students!',
      life_2_title: 'Excel Hackathon',
      life_2_desc: 'An exciting competition to test your Excel skills, from formulas to real-world scenarios. This event pushes students to analyze smart, and build solutions — all in one go!',
      life_3_title: 'AuditLab',
      life_3_desc: 'From 1000+ participants to the final client round, AuditLab was nothing short of transformative! It was a completely immersive audit experience where our students moved beyond theory, applied their knowledge step by step, and came out more confident and job-ready than ever.',
      life_4_title: 'Placement Training',
      life_4_desc: 'Through dedicated placement training, we help students in pursuing successful careers and land dream jobs.',
      featured_title: "We're <span class=\"text-blue\">Featured</span> On",
      featured_subtitle: 'Recognized by leading media houses for our commitment to quality education and student success.',
    };
    
    // Only add fields that don't already exist in the data
    const mergedData = { ...newData, ...currentData };
    
    await client.query(
      "UPDATE ec_pages SET data = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(mergedData), homeId]
    );
    console.log('✅ Updated home page data with all new field values!');
  } else {
    console.log('⚠️  Home page entry not found in ec_pages');
  }
  
  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
