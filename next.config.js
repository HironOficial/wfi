/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Add specific rules to ignore, or disable ESLint entirely during build
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'figma-alpha-api.s3.us-west-2.amazonaws.com',
        port: '',
        pathname: '/images/**',
      },
    ],
  },
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }

      // Configure worker loading
      config.module.rules.push({
        test: /\.worker\.(js|ts)$/,
        use: [
          {
            loader: 'worker-loader',
            options: {
              filename: 'static/workers/[name].[hash].js',
              publicPath: '/_next/',
              inline: 'no-fallback',
            },
          },
        ],
      })
    }

    // Add source maps in development
    if (dev) {
      config.devtool = 'source-map'
    }

    return config
  },
  // Required to make worker-loader work with Next.js
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig 