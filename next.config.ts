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
  // The broker's short reservation link. A redirect here instead of a page: the link only points
  // at the reservation screen, and a page that reads its id would block prerendering.
  async redirects() {
    return [{ source: "/:lang(es|en)/o/:id([A-Za-z0-9]{10})", destination: "/:lang/reservar?oferta=:id", permanent: false }];
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
