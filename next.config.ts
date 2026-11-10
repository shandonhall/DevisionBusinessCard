import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["passkit-generator"],
  // Phone photos commonly exceed the default 1MB Server Action limit.
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
