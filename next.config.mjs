/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Demo product photos (Unsplash License and CC0). Makers' own uploads will come from Supabase Storage.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "pd.w.org" },
    ],
  },
};

export default nextConfig;
