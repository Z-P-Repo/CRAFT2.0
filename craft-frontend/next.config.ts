import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable experimental features
  experimental: {
    // Enable optimizations
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },

  // TypeScript configuration
  typescript: {
    // Type checking during build
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Environment variables available to the client
  env: {
    CUSTOM_KEY: 'my-value',
  },

  // Public runtime configuration
  publicRuntimeConfig: {
    // Available on both server and client
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
  },

  // Server runtime configuration (server-side only)
  serverRuntimeConfig: {
    // Server-side environment variables
    mySecret: process.env.MY_SECRET,
  },

  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // Compression
  compress: true,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  // Rewrites for API proxy (optional)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/:path*`,
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add custom webpack configuration here
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    return config;
  },

};

export default nextConfig;