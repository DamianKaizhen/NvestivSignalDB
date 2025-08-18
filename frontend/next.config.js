const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3010/api/:path*',
      },
    ]
  },
  // Performance optimizations
  experimental: {
    // Enable modern JavaScript features
    esmExternals: true,
    // Optimize server components
    serverComponentsExternalPackages: ['d3'],
  },
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  // Compression
  compress: true,
  // Generate static pages when possible
  output: 'standalone',
  // Minimize bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
}

module.exports = withBundleAnalyzer(nextConfig)