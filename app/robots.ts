import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Serves /robots.txt. Allows crawling of public pages, blocks private app areas.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard/",
        "/question_dashboard/",
        "/quiz/",
        "/subjects/",
        "/select-domain/",
        "/transition/",
        "/roadmap/",
        "/admin/",
        "/audit/",
        "/sign-in/",
        "/sign-up/",
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
