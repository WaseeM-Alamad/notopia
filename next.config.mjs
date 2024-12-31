/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "fopkycgspstkfctmhyyq.supabase.co",
        pathname: "**",
      }
    ],
  },
};

export default nextConfig;
