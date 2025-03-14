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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }

      // Use asset modules for workers
      config.module.rules.push({
        test: /\.worker\.(js|ts)$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/workers/[hash][ext][query]'
        }
      })
    }

    return config
  }
}

module.exports = nextConfig 