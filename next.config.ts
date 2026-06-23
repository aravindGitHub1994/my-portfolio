import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next does not pick up a
  // parent-directory lockfile (avoids the multi-lockfile inference warning).
  turbopack: {
    root: path.join(__dirname),
  },

  // Produce a fully static HTML/CSS/JS export (no Node.js runtime required).
  // Output is written to ./out and is deployable to Vercel as a static site.
  output: "export",

  // next/image optimization needs a server; disable it for static export.
  images: {
    unoptimized: true,
  },

  // Emit each route as a folder with index.html for clean static hosting.
  trailingSlash: true,
};

export default nextConfig;
