import { copy } from "@/lib/copy";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/sign-in", "/sign-up"],
    },
    sitemap: `${copy.brand.url}/sitemap.xml`,
    host: copy.brand.url,
  };
}
