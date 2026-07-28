/**
 * Migration: wire up the ACCA page for full EmDash CMS editing.
 *
 * This Postgres instance uses a wide-table schema: every collection field is
 * its own physical column on ec_pages / ec_faq (not a jsonb "data" blob), and
 * _emdash_fields just tracks the field metadata alongside it. So adding a
 * field here means two things: an _emdash_fields metadata row AND an actual
 * ALTER TABLE ... ADD COLUMN on ec_pages.
 *
 * This script:
 *   1. Adds ~98 new fields (stat_*, world_*, performer_*, faculty_*,
 *      feature_*, syllabus_*, faculties_title, learning_title, etc.) to the
 *      'pages' collection's _emdash_fields metadata.
 *   2. ALTERs ec_pages to add the matching physical columns.
 *   3. Sets those columns (plus corrects the stale hero_heading placeholder)
 *      on the existing 'acca' row to match acca.astro's current design.
 *   4. Seeds 13 ACCA FAQ rows into ec_faq (category='acca'), skipped if that
 *      category already has entries. No schema change needed there since
 *      question/answer/category already exist as columns.
 *
 * Run with: node scripts/migrate-acca-fields.js
 */

import pg from 'pg';
import { readFileSync } from 'fs';

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

// [slug, label, type]
const NEW_FIELDS = [
  ['proof_label', 'Hero Trust Proof Label', 'string'],
];
for (let n = 1; n <= 5; n++) {
  NEW_FIELDS.push([`stat_${n}_num`, `Stat ${n} Number`, 'string']);
  NEW_FIELDS.push([`stat_${n}_label`, `Stat ${n} Label`, 'string']);
}
NEW_FIELDS.push(['world_title', 'Professional World Section Title', 'string']);
for (let n = 1; n <= 5; n++) {
  NEW_FIELDS.push([`world_item_${n}`, `World List Item ${n}`, 'text']);
}
NEW_FIELDS.push(['performers_title', 'Top Performers Section Title', 'string']);
NEW_FIELDS.push(['performers_subtitle', 'Top Performers Subtitle', 'string']);
for (let n = 1; n <= 5; n++) {
  NEW_FIELDS.push([`performer_${n}_name`, `Performer ${n} Name`, 'string']);
  NEW_FIELDS.push([`performer_${n}_photo`, `Performer ${n} Photo`, 'image']);
  NEW_FIELDS.push([`performer_${n}_exam`, `Performer ${n} Exam Tag`, 'string']);
  NEW_FIELDS.push([`performer_${n}_global_rank`, `Performer ${n} Global Rank`, 'string']);
  NEW_FIELDS.push([`performer_${n}_india_rank`, `Performer ${n} India Rank`, 'string']);
}
NEW_FIELDS.push(['faculties_title', 'Faculties Section Title', 'string']);
for (let n = 1; n <= 7; n++) {
  NEW_FIELDS.push([`faculty_${n}_name`, `Faculty ${n} Name`, 'string']);
  NEW_FIELDS.push([`faculty_${n}_qual`, `Faculty ${n} Qualification`, 'string']);
  NEW_FIELDS.push([`faculty_${n}_photo`, `Faculty ${n} Photo`, 'image']);
}
NEW_FIELDS.push(['learning_title', 'Learning Experience Section Title', 'string']);
for (let n = 1; n <= 8; n++) {
  NEW_FIELDS.push([`feature_${n}_title`, `Feature ${n} Title`, 'string']);
  NEW_FIELDS.push([`feature_${n}_desc`, `Feature ${n} Description`, 'text']);
}
NEW_FIELDS.push(['syllabus_title', 'Syllabus Section Title', 'string']);
NEW_FIELDS.push(['syllabus_desc', 'Syllabus Section Description', 'text']);
for (let n = 1; n <= 3; n++) {
  NEW_FIELDS.push([`syllabus_${n}_label`, `Syllabus Item ${n} Label`, 'string']);
  NEW_FIELDS.push([`syllabus_${n}_intro`, `Syllabus Item ${n} Intro`, 'text']);
  NEW_FIELDS.push([`syllabus_${n}_checklist`, `Syllabus Item ${n} Checklist (one per line)`, 'text']);
  NEW_FIELDS.push([`syllabus_${n}_outro`, `Syllabus Item ${n} Outro`, 'text']);
}
NEW_FIELDS.push(['faq_title', 'FAQ Section Title', 'string']);

function getFieldMetaColumnType(type) {
  // Matches the "column_type" label convention already used on existing rows.
  if (type === 'image') return 'JSONB';
  return 'TEXT';
}

function getPgColumnType(type) {
  if (type === 'image') return 'jsonb';
  return 'text';
}

function generateId() {
  const now = Date.now();
  const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let id = '';
  let ts = now;
  for (let i = 9; i >= 0; i--) {
    id = chars[ts % 32] + id;
    ts = Math.floor(ts / 32);
  }
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * 32)];
  }
  return '01' + id.slice(0, 24);
}

// Values to set on the 'acca' ec_pages row. hero_heading is included
// deliberately even though the field already existed: the DB held a stale
// placeholder ("Become an ACCA Certified Global Professional") left over
// from initial scaffolding that acca.astro never actually rendered, so it's
// corrected here to match the page's real, currently-live hero copy.
const ACCA_PAGE_VALUES = {
  hero_heading: 'Accelerate your <br />journey to <span class="text-blue">Career <br />Excellence With <br />ACCA.</span>',
  proof_label: 'TRUSTED BY OVER <span class="highlight-blue">25,000</span><br />STUDENTS GLOBALLY FOR EXCELLENCE!',
  stat_1_num: '7+', stat_1_label: 'Years',
  stat_2_num: '53', stat_2_label: 'World Ranks',
  stat_3_num: '80', stat_3_label: 'National Ranks',
  stat_4_num: '5000+', stat_4_label: 'Affiliates',
  stat_5_num: '25000+', stat_5_label: 'Students',
  world_title: 'Be the <span class="highlight-slate">Professional</span> the<br />World Is <span class="highlight-slate">Looking For!</span>',
  world_item_1: 'Recognition in over 180 countries globally.',
  world_item_2: 'Access to a network of 200,000+ members.',
  world_item_3: 'Fuel your career growth with eligibility to join top MNCs.',
  world_item_4: 'High earning potential from ₹6 LPA to ₹20 LPA.',
  world_item_5: 'Stay in demand with skills valued internationally.',
  performers_title: 'Our Top <span class="text-blue">Performers</span>',
  performers_subtitle: 'Raising the Bar, Setting the Standard',
  performer_1_name: 'Shahanaz Sainudin', performer_1_photo: '/images/topstudents/Students-Website-Template-36-1024x768-1.jpg', performer_1_exam: '((AFM)Dec 2020)', performer_1_global_rank: '1', performer_1_india_rank: '',
  performer_2_name: 'Zinsil Shan', performer_2_photo: '/images/topstudents/Students-Website-Template-39-1024x768-1.jpg', performer_2_exam: '((FM)Dec 2022)', performer_2_global_rank: '1', performer_2_india_rank: '1',
  performer_3_name: 'Shafnas', performer_3_photo: '/images/topstudents/Students-Website-Template-35-1024x768-1.jpg', performer_3_exam: '((ATX)Mar 2023)', performer_3_global_rank: '', performer_3_india_rank: '3',
  performer_4_name: 'Vaishnav Unny', performer_4_photo: '/images/topstudents/Students-Website-Template-38-1024x768-1.jpg', performer_4_exam: '((AAA)Sep 2023)', performer_4_global_rank: '5', performer_4_india_rank: '2',
  performer_5_name: 'Siya Sabu', performer_5_photo: '/images/topstudents/Students-Website-Template-37-1024x768-1.jpg', performer_5_exam: '((SBR)SEP 2020)', performer_5_global_rank: '4', performer_5_india_rank: '1',
  faculties_title: 'Our <span class="text-blue">ACCA</span> Faculties',
  faculty_1_name: 'Anisha V Geo', faculty_1_qual: 'ACCA, M.com', faculty_1_photo: '/images/accaFaculty/Faculty-Website-Template-02.jpg',
  faculty_2_name: 'Ajith Antony', faculty_2_qual: 'ACCA Final, M.com', faculty_2_photo: '/images/accaFaculty/Faculty-Website-Template-03-1024x768-1.jpg',
  faculty_3_name: 'Ghaneem Izz', faculty_3_qual: 'ACCA Affiliate', faculty_3_photo: '/images/accaFaculty/Faculty-Website-Template-04-1024x768-1.jpg',
  faculty_4_name: 'Gopika Mam', faculty_4_qual: 'ACCA, MBA', faculty_4_photo: '/images/accaFaculty/Faculty-Website-Template-06.jpg',
  faculty_5_name: 'Senior Faculty', faculty_5_qual: 'ACCA Member', faculty_5_photo: '/images/accaFaculty/Faculty-Website-Template-08.jpg',
  faculty_6_name: 'ACCA Faculty', faculty_6_qual: 'ACCA, B.com', faculty_6_photo: '/images/accaFaculty/Faculty-Website-Template-12-1024x768-1.jpg',
  faculty_7_name: 'Gopika Mam', faculty_7_qual: 'ACCA, MBA Finance', faculty_7_photo: '/images/accaFaculty/Gopika-mam-Faculty-Website-Template-06.jpg',
  learning_title: '<strong>Exceptional</strong> <span class="text-blue">Elance Learning<br />Experience!</span>',
  feature_1_title: 'World Class Faculties', feature_1_desc: "Elance is distinguished by its exceptional faculty of experts, guaranteeing effective teaching methods. We take pride in providing exceptional guidance and support to our students through every aspect of their courses.",
  feature_2_title: 'Excellent Learning Experience', feature_2_desc: "Elance offers a calm campus where students can learn peacefully from expert teachers. We also focus on co-curricular activities that support personal and social development.",
  feature_3_title: 'Holistic Guidance', feature_3_desc: "At Elance, students don't have to rely solely on faculty. They also receive support from top-ranked mentors, coordinators, and a learning app, creating a complete ecosystem for comprehensive preparation.",
  feature_4_title: 'Hands on Approach', feature_4_desc: "With a hands-on approach to learning, Elance provides opportunities for practical application, allowing you to reinforce your understanding and develop practical skills that employers value.",
  feature_5_title: 'Top-Tier Placement Assistance', feature_5_desc: "Elance prepares students not just for the industry but equips them with essential skills for excellence. Our focus ensures they are ready for successful placements and stand out as professionals.",
  feature_6_title: 'Astonishing Infrastructure', feature_6_desc: "At Elance, every student receives personalized attention to gain an edge in professional commerce exams. Our campuses offer an integrated learning approach supported by advanced technology and top-notch facilities.",
  feature_7_title: 'Accessibility from Anywhere Anytime', feature_7_desc: "Our learning app allows students to study anytime, anywhere. By offering comprehensive resources for their courses, the Elance Learning App simplifies their educational experience.",
  feature_8_title: 'Hostel & Transportation Facility', feature_8_desc: "We at Elance offers convenient hostel facilities and reliable transportation services, ensuring students enjoy a safe, comfortable, and hassle-free learning journey tailored to their needs.",
  syllabus_title: '<span class="text-blue">Course</span> Syllabus',
  syllabus_desc: "ACCA consists of 13 papers,broadly categorized into Fundamental level(9 Papers F1-F9), Strategic Professional level (4 out of 6 papers P1 – P7) The Exam structure is divided into three sections, Knowledge Level, Skills Level and Professional Level.",
  syllabus_1_label: 'Knowledge Level',
  syllabus_1_intro: "Knowledge Level also known as Applied Knowledge level, consists of 3 exams which trains the students with the foundation level in accounting and finance",
  syllabus_1_checklist: "Business and Technology (BT)\nManagement Accounting (MA)\nFinancial Accounting (FA)",
  syllabus_1_outro: "Exam has two sections: Section A of the exam comprises 20 multiple choice questions of 2 marks each. Section B of the exam comprises three 10 mark questions and two 15 mark questions.",
  syllabus_2_label: 'Skill Level',
  syllabus_2_intro: "The Applied Skills level consists of 6 exams which test a student's technical skills across core accounting disciplines.",
  syllabus_2_checklist: "Corporate and Business Law (LW)\nPerformance Management (PM)\nTaxation (TX)\nFinancial Reporting (FR)\nAudit and Assurance (AA)\nFinancial Management (FM)",
  syllabus_2_outro: "These papers are computer-based exams (CBE) and test both knowledge and application skills.",
  syllabus_3_label: 'Professional Level',
  syllabus_3_intro: "The Strategic Professional level is the final stage of ACCA. Students must complete 2 Essentials papers and 2 from 4 Optional papers.",
  syllabus_3_checklist: "Strategic Business Leader (SBL) – Essentials\nStrategic Business Reporting (SBR) – Essentials\nAdvanced Financial Management (AFM) – Optional\nAdvanced Performance Management (APM) – Optional\nAdvanced Taxation (ATX) – Optional\nAdvanced Audit and Assurance (AAA) – Optional",
  syllabus_3_outro: "These exams are scenario-based, testing professional judgment and application at the highest level.",
  faq_title: '<span class="text-blue">Frequently</span> Asked Question',
};

const ACCA_FAQS = [
  ['What is ACCA ??', 'The full form of ACCA is the Association of Chartered Certified Accountants. It is a global professional qualification for those looking to build a career in accounting, finance, & business. The completion of ACCA course helps you gain skills in financial management, auditing, and taxation and is recognized in over 180 countries, offering global career opportunities.'],
  ['Why Elance?', 'Elance stands out for its ACCA Platinum Accredited Partner status, world-class faculty with 13+ years of experience, guaranteed placement assistance, and a comprehensive learning ecosystem including offline, online, and hybrid classes. Our track record of 53 World Ranks and 80 National Ranks speaks for itself.'],
  ['Structure of ACCA programs?', 'ACCA consists of 13 papers divided into three levels: Applied Knowledge (3 papers: BT, MA, FA), Applied Skills (6 papers: LW, PM, TX, FR, AA, FM), and Strategic Professional (4 papers: SBL, SBR, plus 2 from AFM, APM, ATX, AAA). Students must also complete an Ethics and Professional Skills module and 36 months of practical experience.'],
  ['What is the schedule for the ACCA exams?', 'ACCA exams are held four times a year in March, June, September, and December. Applied Knowledge exams are available on demand at CBE centers. Strategic Professional exams take place in March, June, September, and December at authorized exam centers worldwide.'],
  ['How can I get into ACCA ?', 'To register for ACCA, you need a minimum of 2 A-levels and 3 GCSEs (or equivalent), including English and Mathematics. If you hold a relevant degree, you may be eligible for exemptions from some papers. You can register directly through the ACCA website or through an authorized learning provider like Elance.'],
  ['What sets ACCA apart from the other Finance & Accounting courses?', 'ACCA is globally recognized in 180+ countries, offering wider career opportunities than most local qualifications. It covers a broad spectrum including auditing, taxation, financial management, and strategic leadership. ACCA also provides exemptions for degree holders and offers flexible exam scheduling four times a year.'],
  ['What are the exemptions available for ACCA?', 'ACCA offers exemptions based on prior academic qualifications. Commerce graduates may receive exemptions from Applied Knowledge papers (BT, MA, FA) and some Applied Skills papers. The number of exemptions depends on your degree and university. You can check your eligibility on the ACCA website using the exemption calculator.'],
  ['How many papers are there in ACCA?', 'ACCA has a total of 13 papers: 3 at Applied Knowledge level, 6 at Applied Skills level, and 4 at Strategic Professional level (2 Essentials + 2 from 4 Optional papers). Along with these, students must complete the Ethics and Professional Skills module and 36 months of relevant practical experience.'],
  ['Is ACCA exam tough?', 'ACCA exams are challenging but very achievable with the right preparation and guidance. The pass rate varies by paper, typically ranging from 40–60%. At Elance, our expert faculty and structured study programs ensure students are thoroughly prepared, resulting in consistent first-attempt passes and global top ranks.'],
  ['Can I do ACCA after 12th?', 'Yes! Students can start ACCA after completing their 12th standard (Commerce stream preferred). ACCA accepts students who have passed at least 5 GCSEs and 2 A-levels (or equivalent). Students from the commerce stream in India with 65%+ marks in at least 4 subjects including English and Mathematics are eligible.'],
  ['What is the salary for ACCA?', 'ACCA qualified professionals earn competitive salaries globally. In India, entry-level ACCA professionals can expect ₹4–8 LPA, mid-level ₹10–20 LPA, and senior positions can command ₹30 LPA or more. Internationally, ACCA members can earn £35,000–£70,000+ per annum depending on the role and country.'],
  ['What is the ACCA course duration?', "The duration of ACCA depends on the student's prior qualifications and pace. On average, it takes 3–4 years to complete all 13 exams along with the required practical experience (36 months). Students with relevant degrees and exemptions may complete ACCA faster, sometimes within 2–2.5 years."],
  ['When are the ACCA exam dates?', 'ACCA exams are scheduled four times a year: March, June, September, and December. On-demand CBE exams for Applied Knowledge papers are available year-round at authorized test centers. Registration deadlines typically fall 5–7 weeks before the exam session. Check the ACCA website for specific dates each year.'],
];

async function main() {
  console.log('Connecting to PostgreSQL...');
  await client.connect();
  console.log('Connected!');

  // ---------- 1. Add new field metadata + physical columns ----------
  const colResult = await client.query("SELECT id FROM _emdash_collections WHERE slug = 'pages'");
  if (colResult.rows.length === 0) {
    console.error("'pages' collection not found in PostgreSQL!");
    process.exit(1);
  }
  const pagesCollectionId = colResult.rows[0].id;

  const existingResult = await client.query(
    'SELECT slug, sort_order FROM _emdash_fields WHERE collection_id = $1',
    [pagesCollectionId]
  );
  const existingSlugs = new Set(existingResult.rows.map((r) => r.slug));
  let maxSortOrder = existingResult.rows.reduce((max, r) => Math.max(max, r.sort_order || 0), 0);

  const existingColsResult = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'ec_pages'"
  );
  const existingColumns = new Set(existingColsResult.rows.map((r) => r.column_name));

  let addedFields = 0;
  let addedColumns = 0;
  for (const [slug, label, type] of NEW_FIELDS) {
    if (!existingColumns.has(slug)) {
      const pgType = getPgColumnType(type);
      await client.query(`ALTER TABLE ec_pages ADD COLUMN IF NOT EXISTS "${slug}" ${pgType}`);
      existingColumns.add(slug);
      addedColumns += 1;
    }
    if (existingSlugs.has(slug)) continue;
    maxSortOrder += 1;
    const id = generateId();
    await client.query(
      `INSERT INTO _emdash_fields (id, collection_id, slug, label, type, column_type, required, "unique", sort_order, created_at, translatable, searchable)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 0, $7, NOW(), 1, 0)
       ON CONFLICT (collection_id, slug) DO NOTHING`,
      [id, pagesCollectionId, slug, label, type, getFieldMetaColumnType(type), maxSortOrder]
    );
    addedFields += 1;
  }
  console.log(`Added ${addedColumns} physical columns and ${addedFields} field-metadata rows.`);

  // ---------- 2. Set the ACCA page's field values ----------
  const imageFieldSlugs = new Set(NEW_FIELDS.filter(([, , type]) => type === 'image').map(([slug]) => slug));
  const valueEntries = Object.entries(ACCA_PAGE_VALUES);
  const setClauses = valueEntries.map(([col], i) => `"${col}" = $${i + 1}`).join(', ');
  // jsonb image columns need a JSON-encoded value; a bare "/images/x.jpg"
  // string isn't valid JSON on its own. JSON.stringify wraps it in quotes so
  // it round-trips back out as a plain string (matches getCmsImageUrl's
  // `typeof imgData === "string"` branch).
  const params = valueEntries.map(([col, v]) => (imageFieldSlugs.has(col) ? JSON.stringify(v) : v));
  const updateResult = await client.query(
    `UPDATE ec_pages SET ${setClauses}, updated_at = NOW() WHERE slug = 'acca'`,
    params
  );
  console.log(`Updated 'acca' row: ${updateResult.rowCount} row(s) affected.`);

  // ---------- 3. Seed ACCA FAQ entries ----------
  const existingAccaFaqs = await client.query("SELECT COUNT(*)::int AS count FROM ec_faq WHERE category = 'acca'");
  if (existingAccaFaqs.rows[0].count > 0) {
    console.log(`'acca' category already has ${existingAccaFaqs.rows[0].count} FAQ entries — skipping seed.`);
  } else {
    let addedFaqs = 0;
    for (const [question, answer] of ACCA_FAQS) {
      const id = generateId();
      const slug = question
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
      await client.query(
        `INSERT INTO ec_faq (id, slug, status, question, answer, category, created_at, updated_at)
         VALUES ($1, $2, 'published', $3, $4, 'acca', NOW(), NOW())`,
        [id, slug, question, answer]
      );
      addedFaqs += 1;
    }
    console.log(`Seeded ${addedFaqs} ACCA FAQ entries into ec_faq.`);
  }

  await client.end();
  console.log('\n✅ Done!');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
