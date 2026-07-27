// @ts-check
import { defineConfig, sessionDrivers } from 'astro/config';
import { loadEnv } from 'vite';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import emdash, { s3 } from 'emdash/astro';
import { postgres, sqlite } from 'emdash/db';
import path from 'path';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;

// Use Supabase PostgreSQL when DATABASE_URL is present, otherwise fallback to local SQLite (data.db).
const database = databaseUrl
    ? postgres({ connectionString: databaseUrl })
    : sqlite({ url: 'data.db' });

const rawSiteUrl = process.env.EMDASH_SITE_URL || process.env.SITE_URL;
const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const siteUrl = (isVercel && rawSiteUrl?.includes('localhost'))
   ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://elance-learning.vercel.app'))
   : (rawSiteUrl || undefined);

// Use persistent PostgreSQL database session on Vercel/PostgreSQL so login sessions persist across serverless instances, or fs driver in local dev
const sessionDriver = (isVercel && databaseUrl && !databaseUrl.includes('data.db'))
    ? { entrypoint: path.resolve('./src/lib/session-driver.js'), options: { connectionString: databaseUrl } }
    : sessionDrivers.fs();

// Supabase S3 Storage support (when S3_ENDPOINT or S3_ACCESS_KEY_ID is configured)
const s3Endpoint = process.env.S3_ENDPOINT || env.S3_ENDPOINT;
const s3Bucket = process.env.S3_BUCKET || env.S3_BUCKET;
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || env.S3_ACCESS_KEY_ID;
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || env.S3_SECRET_ACCESS_KEY;
const s3Region = process.env.S3_REGION || env.S3_REGION;
const s3PublicUrl = process.env.S3_PUBLIC_URL || env.S3_PUBLIC_URL;

const storage = (s3Endpoint || s3AccessKeyId) ? s3({
    endpoint: s3Endpoint,
    bucket: s3Bucket,
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
    region: s3Region,
    publicUrl: s3PublicUrl,
}) : undefined;

// https://docs.emdashcms.com/existing-project/
export default defineConfig({
    output: 'server',
    adapter: vercel(),
    session: {
        driver: sessionDriver,
    },
    vite: {
        server: {
            watch: {
                ignored: ['**/data.db*', '**/emdash.sqlite*', '**/*.db*', '**/*.sqlite*', '**/.emdash/**', '**/uploads/**', '**/emdash-env.d.ts'],
            },
        },
    },
    integrations: [
        react(),
        emdash({
            database,
            siteUrl,
            storage,
        }),
    ],
});
