import ProductQuality from "@/models/ProductQuality";
import { slugify } from "@/utils/slugify";

const DEFAULT_NAMES = ["Original", "High Copy", "Local", "China"];

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function ensureDefaultProductQualities() {
  let i = 0;
  for (const name of DEFAULT_NAMES) {
    const slug = slugify(name);
    await ProductQuality.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name, slug, sortOrder: i } },
      { upsert: true }
    );
    i += 1;
  }
}

/**
 * Resolve admin/submitted quality string to canonical name stored on Product.
 */
export async function resolveProductQualityName(input) {
  await ensureDefaultProductQualities();
  const raw = String(input ?? "").trim();
  if (!raw) {
    return { ok: false, error: "Quality is required" };
  }
  const bySlug = await ProductQuality.findOne({ slug: slugify(raw) }).lean();
  if (bySlug) return { ok: true, name: bySlug.name };
  const byName = await ProductQuality.findOne({
    name: new RegExp(`^${escapeRegex(raw)}$`, "i"),
  }).lean();
  if (byName) return { ok: true, name: byName.name };
  return {
    ok: false,
    error: `Unknown quality "${raw}". Add it under Sales system → Qualities.`,
  };
}
