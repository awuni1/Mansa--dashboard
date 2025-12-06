/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'mansatomansa.com'],
  },
  // During build, show warnings but don't fail
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;