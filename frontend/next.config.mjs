/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Standardize with remotePatterns (recommended by Next.js)
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'moviebox.ph' },
      { protocol: 'https', hostname: 'pbcdnw.aoneroom.com' },
      { protocol: 'https', hostname: 'i.ibb.co' },
    ],
  },
};

export default nextConfig;
