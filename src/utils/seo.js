// src/utils/seo.js
// Generate SEO meta tag values from EmDash content data

/**
 * Build an SEO metadata object from an EmDash entry's data field.
 * Falls back gracefully when CMS fields are missing.
 *
 * @param {Record<string, unknown>} data - The entry.data object from getEmDashEntry/getEmDashCollection
 * @param {string} [fallbackTitle] - Page-level fallback title
 * @param {string} [fallbackDescription] - Page-level fallback description
 * @returns {{ title: string, description: string, canonical: string, ogImage: string }}
 */
export function getSeoMeta(data = {}, fallbackTitle = '', fallbackDescription = '') {
  return {
    title: String(data.seo_title || data.title || data.name || fallbackTitle),
    description: String(data.seo_description || data.excerpt || data.short_description || fallbackDescription),
    canonical: String(data.canonical_url || ''),
    ogImage: getMediaUrl(data.og_image || data.featured_image || data.thumbnail),
    twitterCard: 'summary_large_image',
  };
}

/**
 * Get a usable URL string from an EmDash image / media value.
 * Handles plain strings, EmDash ImageValue objects, and null/undefined.
 *
 * @param {unknown} mediaValue
 * @returns {string}
 */
export function getMediaUrl(mediaValue) {
  if (!mediaValue) return '';
  if (typeof mediaValue === 'string') return mediaValue;
  if (typeof mediaValue === 'object' && mediaValue !== null) {
    return String(mediaValue.url || mediaValue.src || mediaValue.href || '');
  }
  return '';
}
