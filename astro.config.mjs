// @ts-check
import { defineConfig, sessionDrivers } from 'astro/config';
import { loadEnv } from 'vite';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import emdash from 'emdash/astro';
import { postgres, sqlite } from 'emdash/db';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;

// Use Supabase PostgreSQL when DATABASE_URL is present, otherwise fallback to local SQLite (data.db).
const database = databaseUrl
    ? postgres({ connectionString: databaseUrl })
    : sqlite({ url: 'data.db' });

// In production / Vercel, ignore localhost URLs for siteUrl so WebAuthn/Passkey origin matches correctly
const rawSiteUrl = process.env.EMDASH_SITE_URL || env.EMDASH_SITE_URL || process.env.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const siteUrl = (isVercel && rawSiteUrl?.includes('localhost'))
    ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://elance-learning.vercel.app'))
    : rawSiteUrl;

// Use memory session driver on Vercel to avoid file-system write errors in serverless functions
const sessionDriver = isVercel
    ? sessionDrivers.memory()
    : sessionDrivers.fs();

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
        }),
    ],
});
