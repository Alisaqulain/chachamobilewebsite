import { NAV_CATEGORIES } from "@/data/navCategories";

const PRESET_BY_SLUG = Object.fromEntries(
  NAV_CATEGORIES.map((c) => [c.slug, { label: c.label, blurb: c.blurb, image: c.image, icon: c.icon, filter: c.filter }])
);

export const DEFAULT_NAV_CAT_IMAGE =
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80";
export const DEFAULT_NAV_ICON = "◇";
export const DEFAULT_NAV_BLURB = "Parts & accessories";

export function navPresetForSlug(slug) {
  return PRESET_BY_SLUG[slug] || null;
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
      const p = navPresetForSlug(c.slug);
      const img = c.image && String(c.image).trim();
      return {
        slug: c.slug,
        label: p?.label || c.name,
        blurb: p?.blurb || DEFAULT_NAV_BLURB,
        image: img || p?.image || DEFAULT_NAV_CAT_IMAGE,
        icon: p?.icon || DEFAULT_NAV_ICON,
        filter: p?.filter || c.name,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
