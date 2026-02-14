/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Fix workspace root detection warning
  outputFileTracingRoot: path.join(__dirname),
  images: {
    domains: ['*.supabase.co', 'api.dicebear.com', 'avatars.githubusercontent.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8000/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
