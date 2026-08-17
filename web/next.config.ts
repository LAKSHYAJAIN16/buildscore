import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lean, self-contained build output (a node_modules subset + a server.js
  // entrypoint) -- needed for a small Docker image when self-hosting.
  output: "standalone",
};

export default nextConfig;
