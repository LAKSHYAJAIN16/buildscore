import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lean, self-contained build output (a node_modules subset + a server.js
  // entrypoint) -- needed for a small Docker image when self-hosting.
  output: "standalone",

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // No legitimate reason for this site to be framed by another
          // origin -- blocks clickjacking/UI-redress attacks.
          { key: "X-Frame-Options", value: "DENY" },
          // Stop browsers from MIME-sniffing responses into an executable
          // type (e.g. treating a JSON response as HTML/JS).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Send the full URL only to our own origin; cross-origin
          // navigations get just the origin, not the path/query.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // This site uses none of these browser features -- deny by default.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
