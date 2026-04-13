import { NAV_CATEGORIES } from "@/data/navCategories";

const PRESET_BY_SLUG = Object.fromEntries(
  NAV_CATEGORIES.map((c) => [c.slug, { label: c.label, blurb: c.blurb, image: c.image, icon: c.icon, filter: c.filter }])
);

function isUsableNavImage(s) {
  const t = String(s || "").trim();
  if (!t) return false;
  if (t.startsWith("/")) return true;
  if (/^https?:\/\//i.test(t)) return true;
  return false;
}

export const DEFAULT_NAV_CAT_IMAGE =
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80";
export const DEFAULT_NAV_ICON = "◇";
export const DEFAULT_NAV_BLURB = "Parts & accessories";

export function navPresetForSlug(slug) {
  const s = String(slug ?? "");
  if (PRESET_BY_SLUG[s]) return PRESET_BY_SLUG[s];
  const found = NAV_CATEGORIES.find((c) => c.slug.toLowerCase() === s.toLowerCase());
  return found ? PRESET_BY_SLUG[found.slug] : null;
}

function canonicalCategorySlug(slug) {
  const s = String(slug ?? "");
  const found = NAV_CATEGORIES.find((c) => c.slug.toLowerCase() === s.toLowerCase());
  return found ? found.slug : s;
}

/**
 * @param {Array<{ name: string; slug: string; image?: string }>|null} apiList
 * @returns {Array<{ slug: string; label: string; blurb: string; image: string; icon: string; filter: string }>}
 */
export function mergeCategoriesFromApi(apiList) {
  if (!apiList?.length) {
    return NAV_CATEGORIES.map((c) => ({
      slug: c.slug,
      label: c.label,
      blurb: c.blurb,
      image: c.image,
      icon: c.icon,
      filter: c.filter,
    }));
  }
  return [...apiList]
    .map((c) => {
      const slugOut = canonicalCategorySlug(c.slug);
      const p = navPresetForSlug(c.slug);
      const rawImg = c.image && String(c.image).trim();
      const img = isUsableNavImage(rawImg) ? rawImg : "";
      return {
        slug: slugOut,
        label: p?.label || c.name,
        blurb: p?.blurb || DEFAULT_NAV_BLURB,
        image: img || p?.image || DEFAULT_NAV_CAT_IMAGE,
        icon: p?.icon || DEFAULT_NAV_ICON,
        filter: p?.filter || c.name,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
