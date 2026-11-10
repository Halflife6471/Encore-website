import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/en/app", "/sw/akaunti", "/en/staff", "/sw/wafanyakazi", "/auth/", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
