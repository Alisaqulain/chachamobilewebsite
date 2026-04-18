"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SalesInventoryCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/categories");
        const j = await res.json();
        if (res.ok) setCategories(j.categories || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-black">Inventory by category</h1>
      <p className="mt-1 text-sm text-black/60">Open a category to see mobile, product, quality, stock and returns.</p>

      {loading ? (
        <p className="mt-8 text-sm text-black/55">Loading…</p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {categories.map((c) => (
            <li key={c._id}>
              <Link
                href={`/admin/sales-system/inventory/category/${c._id}`}
                className="flex min-h-14 items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold shadow-sm hover:border-brand"
              >
                {c.name}
                <span className="text-black/35">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
