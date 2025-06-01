/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@omnivara/ui', '@omnivara/contracts'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
