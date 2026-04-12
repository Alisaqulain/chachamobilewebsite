"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function WebsiteAdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/categories?withCounts=1");
        const data = await res.json();
        if (res.ok) setCategories(data.categories || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">Categories</h1>
          <p className="mt-1 text-sm text-black/50">
            Live from MongoDB — open the shop or admin product list filtered by category.
          </p>
        </div>
        <Link
          href="/admin/categories"
          className="rounded-2xl bg-black px-5 py-2.5 text-center text-sm font-semibold text-[#FFA500]"
        >
          Manage in admin
        </Link>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-black/50">Loading…</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {categories.map((c, i) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-black">{c.name}</p>
                  <p className="text-xs text-black/45">/{c.slug}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-black">{c.productCount ?? 0}</p>
                  <p className="text-xs text-black/40">Products</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/shop?category=${encodeURIComponent(c.slug)}`}
                  className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-black hover:border-[#FFA500]/50"
                >
                  View on shop
                </Link>
                <Link
                  href={`/admin/products?category=${encodeURIComponent(c.slug)}`}
                  className="rounded-full bg-[#FFA500] px-4 py-2 text-xs font-bold text-black"
                >
                  Admin products
                </Link>
              </div>
            </motion.div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-black/50">No categories in database yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
