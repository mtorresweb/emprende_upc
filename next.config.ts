import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["ai"],
  experimental: {
    middlewareClientMaxBodySize: "20mb",
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
};

export default nextConfig;
