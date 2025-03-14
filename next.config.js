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
    }
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    }

    // Add worker support
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: { loader: 'worker-loader' },
    })

    return config
  }
}

module.exports = nextConfig 