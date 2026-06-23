import type { MetadataRoute } from "next";
import { SITE } from "@/lib/nav";
import { NAV_LINKS } from "@/lib/nav";

// Statically generated sitemap.xml (emitted at build time for static export).
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return NAV_LINKS.map((link) => ({
    url: new URL(link.href, SITE.url).toString(),
    lastModified,
    changeFrequency: "monthly",
    priority: link.href === "/" ? 1 : 0.8,
  }));
}
