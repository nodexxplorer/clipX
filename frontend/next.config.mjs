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
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://image.tmdb.org https://i.ibb.co https://moviebox.ph https://pbcdnw.aoneroom.com https://placehold.co https://via.placeholder.com",
              "media-src 'self' blob: http://localhost:8000 https://*.aoneroom.com https://*",
              "connect-src 'self' http://localhost:8000 https://accounts.google.com https://api.paystack.co wss://*",
              "frame-src 'self' https://accounts.google.com https://paystack.com https://checkout.paystack.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
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

