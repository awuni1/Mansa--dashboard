/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'mansatomansa.com', 'adnteftmqytcnieqmlma.supabase.co'],
  },
  // During build, show warnings but don't fail
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  },
};

module.exports = nextConfig;