import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Smarlin listing photos. Images read from pasted portal links are rendered `unoptimized`
    // instead, so this list never has to allow arbitrary hosts.
    remotePatterns: [
      { protocol: "https", hostname: "images.realtyserver.com", pathname: "/photo_server.php" },
      { protocol: "https", hostname: "www.smarlin.com" },
      { protocol: "https", hostname: "smarlin.com" },
    ],
  },
};

export default nextConfig;
