import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Smaller Docker images — copies only needed files into standalone/
  output: "standalone",
};

export default nextConfig;
