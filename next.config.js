/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'qtkoqupvfrofgbbhnxfc.supabase.co' },
      { protocol: 'https', hostname: 'files.stripe.com' },
    ],
  },
  // Ensure API routes are never redirected
  async redirects() {
    return []
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
}

module.exports = nextConfig
