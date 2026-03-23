/**
 * URL Slug Utilities
 * Generates readable slugs from movie titles and resolves them back.
 */

/**
 * Convert a movie title + ID into a URL-friendly slug.
 * e.g. "The Dark Knight" + "12345" => "the-dark-knight-12345"
 */
export function toSlug(title, id) {
    if (!title || !id) return id || '';
    const slug = title
        .toLowerCase()
        .replace(/['']/g, '') // remove apostrophes
        .replace(/[^a-z0-9]+/g, '-') // non-alpha to dashes
        .replace(/^-+|-+$/g, '') // trim leading/trailing dashes
        .substring(0, 80); // cap length
    return `${slug}-${id}`;
}

/**
 * Extract the movie ID from a slug.
 * Supports: "the-dark-knight-12345", plain "12345", and UUIDs.
 */
export function fromSlug(slug) {
    if (!slug) return null;
    // UUID pattern
    const uuidMatch = slug.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (uuidMatch) return uuidMatch[1];
    // Numeric ID at the end: "some-title-12345"
    const numMatch = slug.match(/(\d+)$/);
    if (numMatch) return numMatch[1];
    // Try sessionStorage fallback
    try {
        const stored = sessionStorage.getItem('clipx_s_' + slug);
        if (stored) return stored;
    } catch { }
    // Fall through — return as-is
    return slug;
}

/**
 * Store a slug → ID mapping in sessionStorage for resolution.
 */
export function storeSlugMapping(slug, id) {
    try {
        sessionStorage.setItem('clipx_s_' + slug, id);
    } catch { }
}
