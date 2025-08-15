/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // experimental features disabled to improve dev stability
  // Remove the auth config block as it should be in [...nextauth].ts
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig