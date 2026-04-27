import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["lucide-react"],
  // Wymuszone ze względu na specyfikę Next.js 16 i React 19
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
