/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
  },
  serverRuntimeConfig: {
    maxDuration: 1000,
  },
};

export default nextConfig;
