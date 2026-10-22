import type { MetadataRoute } from "next";
import { locales } from "@jakamarinko/types";
import { siteUrl } from "@/components/site/site";

// The public site is open; accounts, the coach area, sign-in and the styleguide are not for search engines.
// Each path is closed exactly and below it ("/en/coach$", "/en/coach/"), so /en/coaching stays open.
export default function robots(): MetadataRoute.Robots {
  const closed = ["account", "coach", "sign-in", "consent", "styleguide"];
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", ...locales.flatMap((l) => closed.flatMap((p) => [`/${l}/${p}$`, `/${l}/${p}/`]))] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
