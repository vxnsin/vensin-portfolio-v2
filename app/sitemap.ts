import type { MetadataRoute } from "next";
import { nav, site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return nav.map((n) => ({ url: `${site.url}${n.href}`, lastModified: new Date() }));
}
