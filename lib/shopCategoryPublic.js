/**
 * Website `Category` documents that were created for parts-ledger experiments before
 * `SalesCategory` existed — must never appear in public shop nav/footer.
 */
const EXCLUDED_PUBLIC_SHOP_SLUGS = new Set(["parts-folder", "open-folder"]);

export function isPublicShopCategory(doc) {
  const slug = String(doc?.slug || "").toLowerCase().trim();
  return slug && !EXCLUDED_PUBLIC_SHOP_SLUGS.has(slug);
}

export function filterCategoriesForPublicShop(categories) {
  return (categories || []).filter(isPublicShopCategory);
}
