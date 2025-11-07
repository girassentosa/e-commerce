import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Disable image optimization errors for missing images in development
    unoptimized: process.env.NODE_ENV === 'development',
    // Allow images from external sources if needed later
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Suppress hydration warnings in development
  reactStrictMode: true,
};

export default nextConfig;
