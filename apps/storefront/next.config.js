/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
  // Proxy API requests to local development server
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
