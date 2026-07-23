// src/utils/media.js
// Helpers for working with EmDash media values (images, files, videos)

/**
 * Extract a usable URL from an EmDash media/image field value.
 * Works with:
 *  - Plain URL strings
 *  - EmDash ImageValue objects { url, width, height, alt, ... }
 *  - EmDash FileValue objects  { url, filename, mimeType, ... }
 *  - null / undefined → returns fallback
 *
 * @param {unknown} mediaValue - The raw value from entry.data.*
 * @param {string} [fallback] - URL to use when media is missing
 * @returns {string}
 */
export function getMediaUrl(mediaValue, fallback = '') {
  if (!mediaValue) return fallback;
  if (typeof mediaValue === 'string') return mediaValue || fallback;
  if (typeof mediaValue === 'object' && mediaValue !== null) {
    return String(mediaValue.url || mediaValue.src || mediaValue.href || fallback);
  }
  return fallback;
}

/**
 * Extract alt text from an EmDash image value.
 *
 * @param {unknown} imageValue
 * @param {string} [fallback]
 * @returns {string}
 */
export function getImageAlt(imageValue, fallback = '') {
  if (!imageValue || typeof imageValue !== 'object') return fallback;
  return String(imageValue.alt || imageValue.title || fallback);
}

/**
 * Build a srcset-friendly image object from an EmDash image value.
 * Returns an object with url, alt, width, height.
 *
 * @param {unknown} imageValue
 * @param {string} [fallbackUrl]
 * @returns {{ url: string, alt: string, width: number | null, height: number | null }}
 */
export function getImageProps(imageValue, fallbackUrl = '') {
  const url = getMediaUrl(imageValue, fallbackUrl);
  const alt = getImageAlt(imageValue);
  const width = (imageValue && typeof imageValue === 'object' && imageValue.width) ? Number(imageValue.width) : null;
  const height = (imageValue && typeof imageValue === 'object' && imageValue.height) ? Number(imageValue.height) : null;
  return { url, alt, width, height };
}
