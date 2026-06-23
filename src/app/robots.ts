import type { MetadataRoute } from "next";
import { SITE } from "@/lib/nav";

// Statically generated robots.txt (emitted at build time for static export).
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: new URL("/sitemap.xml", SITE.url).toString(),
  };
}
