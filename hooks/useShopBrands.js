"use client";

import { useEffect, useState } from "react";

export function useShopBrands() {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/brands", { cache: "no-store" });
        const data = await res.json();
        if (cancelled || !res.ok) return;
        setBrands(data.brands || []);
      } catch {
        if (!cancelled) setBrands([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return brands;
}
