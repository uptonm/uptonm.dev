import { copy } from "@/lib/copy";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: copy.brand.url,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
