/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
  // Foundation only - no API routes yet
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8787/:path*',
      },
    ]
  },
}

module.exports = nextConfig
