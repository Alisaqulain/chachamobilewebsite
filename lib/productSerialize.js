/**
 * Normalizes a populated Product document for API + storefront (brand/model strings).
 */
export function serializeProduct(p) {
  if (!p) return null;

  const brandObj = p.brandId && typeof p.brandId === "object" && p.brandId.name ? p.brandId : null;
  const modelObj = p.modelId && typeof p.modelId === "object" && p.modelId.name ? p.modelId : null;
  const catObj =
    p.categoryId && typeof p.categoryId === "object" && p.categoryId.name ? p.categoryId : null;

  const brand = brandObj?.name ?? (typeof p.brand === "string" ? p.brand : "") ?? "";
  const model = modelObj?.name ?? (typeof p.model === "string" ? p.model : "") ?? "";
  const category = catObj?.name ?? "";

  const categoryId = catObj
    ? { _id: String(catObj._id), name: catObj.name, slug: catObj.slug }
    : null;

  return {
    _id: p._id.toString(),
    name: p.name,
    price: p.price,
    purchasePrice: Number(p.purchasePrice ?? 0),
    sellingPrice: Number(p.sellingPrice ?? p.price ?? 0),
    stock: Number(p.stock ?? 0),
    quality: p.quality,
    description: p.description ?? "",
    images: Array.isArray(p.images) ? p.images : [],
    featured: Boolean(p.featured),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    brand,
    model,
    category,
    brandId: brandObj?._id ? String(brandObj._id) : p.brandId ? String(p.brandId) : null,
    modelId: modelObj?._id ? String(modelObj._id) : p.modelId ? String(p.modelId) : null,
    categoryId,
  };
}
