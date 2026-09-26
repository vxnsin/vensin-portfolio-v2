import type { MetadataRoute } from "next";
import { nav, site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = [...nav.map((n) => n.href), "/contact", "/privacy"];
  return pages.map((href) => ({
    url: `${site.url}${href}`,
    lastModified: now,
    changeFrequency: href === "/" ? "weekly" : "monthly",
    priority: href === "/" ? 1 : 0.7,
  }));
}
