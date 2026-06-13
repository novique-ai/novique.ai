import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
      {
        protocol: 'https',
        hostname: 'weubuiuqgwaviwfqljwh.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      // /solutions is superseded by the new /services surface (redesign).
      { source: '/solutions', destination: '/services', permanent: true },
    ];
  },
};

export default nextConfig;
