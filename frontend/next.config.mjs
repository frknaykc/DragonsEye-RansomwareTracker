/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    'http://172.16.20.24:3000',
    'http://localhost:3000',
  ],
  reactStrictMode: false,
  // Empty turbopack config to silence the warning
  turbopack: {},
}

export default nextConfig
