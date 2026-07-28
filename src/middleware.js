import { sequence } from 'astro:middleware';
import { onRequest as setup } from 'emdash/middleware/setup';
import { onRequest as auth } from 'emdash/middleware/auth';
import { onRequest as redirect } from 'emdash/middleware/redirect';

// Intercept local EmDash media API requests and redirect directly to public Supabase Storage CDN
export const mediaRedirect = async (context, next) => {
  const { pathname } = context.url;
  if (pathname.includes('/_emdash/api/media/file/')) {
    const filename = pathname.split('/_emdash/api/media/file/').pop();
    if (filename) {
      return context.redirect(`https://uvsypcermzvgktrufhcw.supabase.co/storage/v1/object/public/images/${filename}`, 307);
    }
  }
  return next();
};

// Official EmDash middleware chain (named export format compatible with v0.30.0)
export const onRequest = sequence(mediaRedirect, setup, auth, redirect);
