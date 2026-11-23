/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The crochet creator moved from /studio to /creator.
  async redirects() {
    return [
      { source: "/studio", destination: "/creator", permanent: true },
      { source: "/studio/new", destination: "/creator/editor", permanent: false },
    ];
  },
  images: {
    // Demo product photos (Unsplash License and CC0). Makers' own uploads will come from Supabase Storage.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
};

export default nextConfig;
