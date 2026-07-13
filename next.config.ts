import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone only for Docker (see Dockerfile). PaaS one-click
  // (Vercel / Netlify / Railway / Render) uses the default Next output.
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
