/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "tergar.org" },
      { protocol: "https", hostname: "**.tergar.org" },
    ],
  },
};

export default nextConfig;
