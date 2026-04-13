/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Skip server-side optimization for external images — the CDN
    // (pbcdnw.aoneroom.com) responds too slowly and causes TimeoutError.
    // Images are already optimized JPEGs from the CDN; no need to re-process.
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'moviebox.ph' },
      { protocol: 'https', hostname: '*.aoneroom.com' },
      { protocol: 'https', hostname: 'pbcdnw.aoneroom.com' },
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    minimumCacheTTL: 3600,
    dangerouslyAllowSVG: true,
  },

  // ---------------------------------------------------------------------------
  // Security Headers — CSP, XSS protection, clickjacking prevention, HSTS
  // ---------------------------------------------------------------------------
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // CSP is now handled by middleware.js with per-request nonces.
          // See /middleware.js for the strict Content-Security-Policy.
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

