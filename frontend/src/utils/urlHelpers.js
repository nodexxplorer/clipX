/**
 * Shared URL utilities for slug-based routing.
 *
 * UNIFIED: Delegates to utils/slug.js so every component produces
 * ID-embedded slugs like "the-dark-knight-12345". The ID is always
 * recoverable from the URL — no sessionStorage dependency.
 */

import { toSlug, fromSlug, storeSlugMapping as _storeSlug } from './slug';

/**
 * Simple text→slug (no ID). Kept for backward compat but prefer toSlug().
 */
export const getSlug = (text) =>
    text
        ? text
            .toString()
            .toLowerCase()
            .replace(/['']/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        : '';

/**
 * Store a slug → id mapping in sessionStorage (backup for legacy URLs).
 */
export const storeSlugMapping = _storeSlug;

/**
 * Resolve a URL segment to a real movie ID.
 * Delegates to slug.js fromSlug() which handles:
 *  1. UUID pattern
 *  2. Trailing numeric ID (e.g. "the-dark-knight-12345")
 *  3. sessionStorage fallback
 */
export const resolveMovieId = fromSlug;

/**
 * Build the movie detail URL with ID embedded in slug.
 * e.g. { title: "Inception", id: "12345" } → "/movies/inception-12345"
 */
export const movieUrl = (movie) => {
    if (!movie) return '/movies';
    const slug = toSlug(movie.title, movie.id);
    _storeSlug(slug, movie.id);
    return `/movies/${slug}`;
};

/**
 * Build the watch page URL with ID embedded in slug.
 */
export const watchUrl = (movie, season = 1, episode = 1) => {
    if (!movie) return '/watch';
    const slug = toSlug(movie.title, movie.id);
    _storeSlug(slug, movie.id);
    return `/watch/${slug}?s=${season}&e=${episode}`;
};
