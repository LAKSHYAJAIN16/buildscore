import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lean, self-contained build output (a node_modules subset + a server.js
  // entrypoint) -- needed for a small Docker image when self-hosting.
  output: "standalone",

  async headers() {
    const isDev = process.env.NODE_ENV === "development";

    // No nonces: that requires forcing every page into dynamic rendering
    // (see node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md),
    // a real cost this mostly-static marketing site with no sensitive data
    // doesn't need to pay. 'unsafe-inline' is required regardless of nonces
    // for script-src (Next's own inline RSC hydration script) and style-src
    // (framer-motion and BackgroundFX set `style={{...}}` throughout,
    // confirmed by inspecting rendered output) -- verified both are actually
    // present, not assumed. The remaining directives still do real work:
    // connect-src blocks exfiltration to a third-party origin if an XSS bug
    // is ever introduced, and frame-ancestors/base-uri/form-action/object-src
    // close off clickjacking, base-tag hijacking, form hijacking, and plugin
    // content respectively.
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data:;
      font-src 'self';
      connect-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      ${isDev ? "" : "upgrade-insecure-requests;"}
    `
      .replace(/\s{2,}/g, " ")
      .trim();

    return [
      {
        source: "/:path*",
        headers: [
          // No legitimate reason for this site to be framed by another
          // origin -- blocks clickjacking/UI-redress attacks. Redundant
          // with frame-ancestors above for CSP-aware browsers, kept for
          // the ones that only understand the older header.
          { key: "X-Frame-Options", value: "DENY" },
          // Stop browsers from MIME-sniffing responses into an executable
          // type (e.g. treating a JSON response as HTML/JS).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Send the full URL only to our own origin; cross-origin
          // navigations get just the origin, not the path/query.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // This site uses none of these browser features -- deny by default.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: cspHeader },
        ],
      },
    ];
  },
};

export default nextConfig;
