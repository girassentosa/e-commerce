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
  // Note: middleware.ts deprecation warning cannot be suppressed
  // This is a Next.js framework warning, not a code issue
  // middleware.ts is still fully functional in Next.js 16
};

export default nextConfig;
