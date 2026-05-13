import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { SITE_URL } from "@/lib/site-config";

const STATIC_PATHS = [
  "/",
  "/shop",
  "/about",
  "/contact",
  "/services",
  "/faq",
  "/order-guide",
  "/warranty",
  "/shipping",
  "/terms",
  "/privacy",
  "/refund",
  "/cart",
  "/mobile-spare-parts-muzaffarnagar",
  "/mobile-spare-parts-meerut",
  "/mobile-spare-parts-shamli",
];

/** @returns {import('next').MetadataRoute.Sitemap} */
export default async function sitemap() {
  const now = new Date();
  const entries = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "weekly",
    priority: path === "/" ? 1 : path.startsWith("/mobile-") ? 0.85 : 0.75,
  }));

  try {
    await connectDB();
    const products = await Product.find({}).select("_id updatedAt").lean().limit(3000);
    for (const p of products) {
      entries.push({
        url: `${SITE_URL}/product/${p._id}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
        changeFrequency: "weekly",
        priority: 0.55,
      });
    }
  } catch {
    /* DB unavailable at build — static URLs still valid */
  }

  return entries;
}
