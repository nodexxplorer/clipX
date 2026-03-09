/**
 * Shared URL utilities for slug-based routing.
 * MovieCard stores slug→id in sessionStorage; [id].js resolves it back.
 */

export const getSlug = (text) =>
    text
        ? text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '')
        : '';

/**
 * Store a slug → id mapping in sessionStorage so detail pages can resolve
 * clean slug-only URLs back to the real API id.
 */
export const storeSlugMapping = (slug, id) => {
    try {
        sessionStorage.setItem('clipx_s_' + slug, String(id));
    } catch { }
};

/**
 * Resolve a URL segment to a real movie ID.
 *  1. Try numeric ID or UUID (backward compat)
 *  2. Try sessionStorage lookup
 *  3. Fallback: return as-is
 */
export const resolveMovieId = (segment) => {
    if (!segment) return null;
    const match = segment.match(
        /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+)/i
    );
    if (match) return match[0];
    try {
        const stored = sessionStorage.getItem('clipx_s_' + segment);
        if (stored) return stored;
    } catch { }
    return segment;
};

/**
 * Build the movie detail URL (slug-only).
 * Also stores the slug→id mapping automatically.
 */
export const movieUrl = (movie) => {
    const slug = getSlug(movie.title);
    if (slug) storeSlugMapping(slug, movie.id);
    return `/movies/${slug || movie.id}`;
};

/**
 * Build the watch page URL (slug-only).
 */
export const watchUrl = (movie, season = 1, episode = 1) => {
    const slug = getSlug(movie.title);
    if (slug) storeSlugMapping(slug, movie.id);
    return `/watch/${slug || movie.id}?s=${season}&e=${episode}`;
};
