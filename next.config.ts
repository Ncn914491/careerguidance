import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@heroicons/react', '@supabase/supabase-js']
  },
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: false
  },
  poweredByHeader: false,
  compress: true
};

export default nextConfig;
