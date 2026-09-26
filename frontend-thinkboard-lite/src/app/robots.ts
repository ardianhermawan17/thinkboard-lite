import type { MetadataRoute } from "next"

/**
 * The pilot workspace is private: it is not a public site to be crawled. This exists so /robots.txt is valid
 * (Lighthouse's `robots-txt`), and it says "stay out" rather than serving the app shell at that path.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] }
}
