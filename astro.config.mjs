// @ts-check
import { defineConfig, sessionDrivers } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import emdash from 'emdash/astro';
import { postgres, sqlite } from 'emdash/db';

// Use Supabase PostgreSQL when DATABASE_URL is present, otherwise fallback to local SQLite (data.db).
const database = process.env.DATABASE_URL
    ? postgres({ connectionString: process.env.DATABASE_URL })
    : sqlite({ url: 'data.db' });

// https://docs.emdashcms.com/existing-project/
export default defineConfig({
    output: 'server',
    adapter: vercel(),
    session: {
        driver: sessionDrivers.fs(),
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
        }),
    ],
});
