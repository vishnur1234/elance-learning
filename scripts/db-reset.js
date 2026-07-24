import { Kysely, PostgresDialect, SqliteDialect } from 'kysely';
import BetterSqlite3 from 'better-sqlite3';
import pg from 'pg';
import { runMigrations } from 'emdash/db';
import { t as applySeed } from '../node_modules/emdash/dist/apply-CmIJK9j8.mjs';
import { loadEnv } from 'vite';
import fs from 'fs';
import path from 'path';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;
const mode = process.argv[2] || 'all';

async function main() {
  let db;

  if (databaseUrl && !databaseUrl.includes('data.db')) {
    console.log('🔗 Connecting to PostgreSQL database (Supabase)...');
    db = new Kysely({
      dialect: new PostgresDialect({
        pool: new pg.Pool({ connectionString: databaseUrl })
      })
    });
  } else {
    console.log('📁 Connecting to local SQLite database (data.db)...');
    db = new Kysely({
      dialect: new SqliteDialect({
        database: new BetterSqlite3('data.db')
      })
    });
  }

  try {
    if (mode === 'users') {
      console.log('🧹 Cleaning users, credentials, and resetting setup wizard...');
      try { await db.deleteFrom('credentials').execute(); } catch {}
      try { await db.deleteFrom('users').execute(); } catch {}
      try { await db.deleteFrom('auth_challenges').execute(); } catch {}
      try { await db.deleteFrom('auth_tokens').execute(); } catch {}
      try { await db.deleteFrom('_emdash_authorization_codes').execute(); } catch {}
      try { await db.deleteFrom('_emdash_device_codes').execute(); } catch {}
      try { await db.deleteFrom('_emdash_oauth_tokens').execute(); } catch {}
      try {
        await db.updateTable('options')
          .set({ value: JSON.stringify('false') })
          .where('name', '=', 'emdash:setup_complete')
          .execute();
      } catch {}
      console.log('✅ Users wiped and setup wizard reset successfully!');
    } else {
      console.log('⚙️ Running database migrations...');
      await runMigrations(db);

      console.log('🌱 Applying master seed data (.emdash/seed.json)...');
      const seedFile = path.resolve('.emdash/seed.json');
      if (fs.existsSync(seedFile)) {
        const seedRaw = fs.readFileSync(seedFile, 'utf8');
        const seedData = JSON.parse(seedRaw);
        const result = await applySeed(db, seedData, { onConflict: 'update' });
        console.log('✅ Master seed applied successfully!');
      } else {
        console.log('⚠️ .emdash/seed.json not found, skipping seed.');
      }
    }
  } catch (err) {
    console.error('❌ DB Operation Error:', err);
  } finally {
    await db.destroy();
  }
}

main();
