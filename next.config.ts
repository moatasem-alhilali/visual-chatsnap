import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const htmlVaryHeader = {
  key: "Vary",
  value:
    "rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept, Accept-Encoding",
};

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/",
        headers: [htmlVaryHeader],
      },
      {
        source: "/ar",
        headers: [htmlVaryHeader],
      },
      {
        source: "/en",
        headers: [htmlVaryHeader],
      },
      {
        source: "/:locale(ar|en)",
        headers: [htmlVaryHeader],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
