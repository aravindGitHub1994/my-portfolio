import type { MetadataRoute } from "next";
import { SITE } from "@/lib/nav";

// Statically generated sitemap.xml (emitted at build time for static export).
// The site is a single scroll page now (ADR-005) — one URL.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
