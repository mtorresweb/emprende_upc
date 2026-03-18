import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["ai"],
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
};

export default nextConfig;
