import type { NextConfig } from "next";
const apiOrigin = process.env.API_INTERNAL_ORIGIN ?? "http://127.0.0.1:3001";
const config: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["242places"],
  async rewrites() {
    return [
      "/v1/:path*",
      "/docs/:path*",
      "/openapi.json",
      "/health/:path*",
    ].map((source) => ({ source, destination: apiOrigin + source }));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
