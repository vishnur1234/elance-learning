// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import emdash from 'emdash/astro';
import { postgres, sqlite } from 'emdash/db';

// Use local SQLite (data.db) for development so seeded collections & entries work instantly.
// Use Supabase PostgreSQL in production builds when DATABASE_URL is present.
const isProd = process.env.NODE_ENV === 'production';
const database = (isProd && process.env.DATABASE_URL)
    ? postgres({ connectionString: process.env.DATABASE_URL })
    : sqlite({ url: 'data.db' });

// https://docs.emdashcms.com/existing-project/
export default defineConfig({
    output: 'server',
    adapter: node({ mode: 'standalone' }),
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
