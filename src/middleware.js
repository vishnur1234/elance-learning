import { sequence } from 'astro:middleware';
import { onRequest as requestContext } from 'emdash/middleware/request-context';
import { onRequest as setup } from 'emdash/middleware/setup';
import { onRequest as auth } from 'emdash/middleware/auth';
import { onRequest as redirect } from 'emdash/middleware/redirect';

// https://docs.emdashcms.com/existing-project/
// Official EmDash middleware chain with request-context enabled
export const onRequest = sequence(requestContext, setup, auth, redirect);
