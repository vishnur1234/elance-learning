import { sequence } from 'astro:middleware';
import { onRequest as setup } from 'emdash/middleware/setup';
import { onRequest as auth } from 'emdash/middleware/auth';
import { onRequest as redirect } from 'emdash/middleware/redirect';

// https://docs.emdashcms.com/existing-project/
// Official EmDash middleware chain (named export format compatible with v0.30.0)
export const onRequest = sequence(setup, auth, redirect);
