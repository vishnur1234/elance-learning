import { defineLiveCollection } from 'astro:content';
import { emdashLoader } from 'emdash/runtime';

// Official Live Content Collections configuration for Astro 7 + EmDash CMS
export const collections = {
  _emdash: defineLiveCollection({
    loader: emdashLoader(),
  }),
};
