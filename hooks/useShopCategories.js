"use client";

import { useEffect, useState } from "react";
import { mergeCategoriesFromApi } from "@/lib/categoryNavMerge";

export function useShopCategories() {
  const [categories, setCategories] = useState(() => mergeCategoriesFromApi(null));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        const data = await res.json();
        if (cancelled || !res.ok) return;
        setCategories(mergeCategoriesFromApi(data.categories || []));
      } catch {
        /* keep static defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return categories;
}
