import type { MetadataRoute } from "next";

const BASE_URL = "https://www.novique.ai";

const ROUTES = [
  "/",
  "/work",
  "/services",
  "/about",
  "/consultation",
  "/contact",
  "/blog",
  "/labs",
  "/roi",
  "/privacy",
  "/terms",
  "/links",
  "/apps",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified,
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
