import type { NextConfig } from "next";

import { getSecurityHeaders } from "./lib/security-headers";

const securityHeaders = Object.entries(
  getSecurityHeaders(
    process.env.NODE_ENV === "production" ? "production" : "development"
  )
).map(([key, value]) => ({
  key,
  value,
}));

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
