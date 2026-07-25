/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Ensure proper handling of dynamic routes
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig
