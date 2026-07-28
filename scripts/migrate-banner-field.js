/**
 * Migration: add the shared 'banner_text' field (the "Enrollment closes
 * soon" top banner) to the 'pages' collection, and set it on the 'acca' and
 * 'cma' page entries so the visible banner text is unchanged after the
 * field goes live.
 *
 * Run with: node scripts/migrate-banner-field.js
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

async function main() {
  console.log('Connecting to PostgreSQL...');
  await client.connect();
  console.log('Connected!');

  const colResult = await client.query("SELECT id FROM _emdash_collections WHERE slug = 'pages'");
  if (colResult.rows.length === 0) {
    console.error("'pages' collection not found in PostgreSQL!");
    process.exit(1);
  }
  const pagesCollectionId = colResult.rows[0].id;

  const colCheck = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'ec_pages' AND column_name = 'banner_text'"
  );
  if (colCheck.rows.length === 0) {
    await client.query('ALTER TABLE ec_pages ADD COLUMN IF NOT EXISTS "banner_text" text');
    console.log('Added banner_text column to ec_pages.');
  } else {
    console.log('banner_text column already exists on ec_pages.');
  }

  const fieldCheck = await client.query(
    'SELECT slug, sort_order FROM _emdash_fields WHERE collection_id = $1 ORDER BY sort_order DESC LIMIT 1',
    [pagesCollectionId]
  );
  const alreadyHasField = await client.query(
    "SELECT 1 FROM _emdash_fields WHERE collection_id = $1 AND slug = 'banner_text'",
    [pagesCollectionId]
  );
  if (alreadyHasField.rows.length === 0) {
    const nextSort = (fieldCheck.rows[0]?.sort_order || 0) + 1;
    const id = generateId();
    await client.query(
      `INSERT INTO _emdash_fields (id, collection_id, slug, label, type, column_type, required, "unique", sort_order, created_at, translatable, searchable)
       VALUES ($1, $2, 'banner_text', 'Top Enrollment Banner Text', 'string', 'TEXT', 0, 0, $3, NOW(), 1, 0)
       ON CONFLICT (collection_id, slug) DO NOTHING`,
      [id, pagesCollectionId, nextSort]
    );
    console.log('Added banner_text field metadata.');
  } else {
    console.log('banner_text field metadata already exists.');
  }

  const updateResult = await client.query(
    `UPDATE ec_pages SET banner_text = 'Enrollment closes soon', updated_at = NOW() WHERE slug IN ('acca', 'cma') AND (banner_text IS NULL OR banner_text = '')`
  );
  console.log(`Set banner_text on ${updateResult.rowCount} row(s) (acca/cma, only where empty).`);

  await client.end();
  console.log('\n✅ Done!');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
