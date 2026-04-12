"use client";

import Link from "next/link";
import { useShopCategories } from "@/hooks/useShopCategories";
import { useShopBrands } from "@/hooks/useShopBrands";
import { FALLBACK_BRAND_NAMES } from "@/data/fallbackBrandNames";

function isLikelyObjectId(id) {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
}

export default function FooterNavColumns() {
  const categories = useShopCategories();
  const brands = useShopBrands();

  const brandRows =
    brands.length > 0
      ? [...brands].sort((a, b) => a.name.localeCompare(b.name))
      : FALLBACK_BRAND_NAMES.map((name) => ({ _id: `fb-${name}`, name }));

  return (
    <>
      <div className="col-span-2 sm:col-span-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFA500]">Categories</p>
        <ul className="mt-4 columns-2 gap-x-4 text-sm text-white/65 sm:columns-1">
          {categories.map((c) => (
            <li key={c.slug} className="mb-2 break-inside-avoid">
              <Link
                href={`/shop?category=${encodeURIComponent(c.slug)}`}
                className="transition hover:text-white"
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFA500]">Brands</p>
        <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1 text-sm text-white/65 sm:max-h-none">
          {brandRows.map((b) => {
            const id = isLikelyObjectId(b._id) ? b._id : null;
            const href = id
              ? `/shop?brandId=${encodeURIComponent(id)}`
              : `/shop?brand=${encodeURIComponent(b.name)}`;
            return (
              <li key={b._id}>
                <Link href={href} className="transition hover:text-white">
                  {b.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
