import { copy } from "@/lib/copy";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mike Upton — Software Engineer",
    short_name: "Mike Upton",
    description: copy.seo.description,
    start_url: "/",
    display: "standalone",
    background_color: "#12100e",
    theme_color: "#12100e",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
