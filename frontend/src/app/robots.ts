import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/*",
        "/api/",
        "/cart",
        "/checkout",
        "/checkout/*",
        "/login",
        "/register",
        "/dashboard",
        "/orders",
        "/orders/*",
        "/maintenance",
        "/maintenance/*",
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
    host: getSiteUrl(),
  };
}
