"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function groupByMobile(products) {
  const map = new Map();
  for (const p of products) {
    const label = [p.brand, p.model].filter(Boolean).join(" ").trim() || p.name || "Other";
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(p);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export default function SalesSystemDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput, 320);
  const [categorySlug, setCategorySlug] = useState("");
  const [quality, setQuality] = useState("");
  const [qualityOptions, setQualityOptions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/summary");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        setStats(json);
      } catch (e) {
        setError(e.message || "Failed loading dashboard");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, qRes] = await Promise.all([fetch("/api/categories"), fetch("/api/product-qualities")]);
        const catJson = await catRes.json();
        const qJson = await qRes.json();
        if (catRes.ok) setCategories(catJson.categories || []);
        if (qRes.ok) setQualityOptions(qJson.qualities || []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const runSearch = useCallback(async () => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (categorySlug) params.set("category", categorySlug);
      if (quality) params.set("quality", quality);
      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed");
      setSearchResults(json.products || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [search, categorySlug, quality]);

  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  const grouped = useMemo(() => groupByMobile(searchResults), [searchResults]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-black">Sales Dashboard</h1>
      <p className="mt-1 text-sm text-black/60">
        Search stock by mobile name, filter by category and quality. Website catalogue is separate.
      </p>

      {error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-black/45">Total products</p>
          <p className="mt-2 text-3xl font-black text-black">{stats?.productCount ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-black/45">Total stock (units)</p>
          <p className="mt-2 text-3xl font-black text-black">
            {stats?.totalStock != null ? stats.totalStock.toLocaleString("en-IN") : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-red-800/80">Low stock (&lt; 5)</p>
          <p className="mt-2 text-3xl font-black text-red-700">{stats?.lowStockCount ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-black/45">Today&apos;s sales</p>
          <p className="mt-2 text-3xl font-black text-black">{stats?.todaySalesCount ?? "—"}</p>
          <p className="mt-1 text-sm font-semibold text-black/60">
            ₹{Number(stats?.todaySalesAmount ?? 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/admin/sales-system/sales"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-bold text-black"
        >
          New sale
        </Link>
        <Link
          href="/admin/sales-system/inventory"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/15 px-5 text-sm font-semibold text-black"
        >
          Full inventory
        </Link>
      </div>

      {/* Live stock search */}
      <section className="mt-10 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-black">Stock search</h2>
        <p className="mt-1 text-xs text-black/50">Updates as you type. Use filters to narrow SKUs.</p>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <label className="text-xs font-bold uppercase text-black/45">Search mobile</label>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search mobile (iPhone 12, Samsung M31...)"
              className="mt-1 w-full min-h-14 rounded-2xl border-2 border-black/10 px-4 text-base outline-none focus:border-brand"
              autoComplete="off"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="text-xs font-bold uppercase text-black/45">Category</label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c._id} value={String(c.slug || "").toLowerCase()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label className="text-xs font-bold uppercase text-black/45">Quality</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              <option value="">All</option>
              {qualityOptions.map((q) => (
                <option key={q._id} value={q.name}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          {searchLoading ? (
            <p className="text-sm text-black/50">Loading…</p>
          ) : grouped.length === 0 ? (
            <p className="rounded-xl border border-dashed border-black/15 bg-zinc-50 px-4 py-8 text-center text-sm text-black/50">
              No products match. Try another search or clear filters.
            </p>
          ) : (
            <div className="space-y-4">
              {grouped.map(([mobile, items]) => (
                <div key={mobile} className="rounded-xl border border-black/10 bg-zinc-50/80 px-4 py-3">
                  <p className="font-bold text-black">{mobile}</p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {items
                      .slice()
                      .sort((a, b) => (a.category || "").localeCompare(b.category || ""))
                      .map((p) => (
                        <li
                          key={p._id}
                          className={`flex flex-wrap items-baseline justify-between gap-2 border-b border-black/5 py-1.5 last:border-0 ${
                            Number(p.stock) < 5 ? "text-red-700" : "text-black/85"
                          }`}
                        >
                          <span>
                            <span className="font-semibold">{p.category || "—"}</span>
                            <span className="text-black/45"> · </span>
                            <span>{p.quality}</span>
                          </span>
                          <span className="tabular-nums font-bold">
                            {Number(p.stock)} stock · ₹{Number(p.sellingPrice ?? p.price ?? 0).toLocaleString("en-IN")}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Low stock alert */}
      <section className="mt-10 rounded-2xl border-2 border-red-200 bg-red-50/40 p-5">
        <h2 className="text-lg font-bold text-red-900">Low stock items</h2>
        <p className="mt-1 text-xs text-red-900/70">Stock below 5 units — restock soon.</p>
        {!stats?.lowStockItems?.length ? (
          <p className="mt-4 text-sm text-red-900/60">No low-stock SKUs right now.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-red-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-red-100/80 text-xs font-bold uppercase text-red-900/80">
                <tr>
                  <th className="px-3 py-2">Mobile</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Quality</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {stats.lowStockItems.map((row) => (
                  <tr key={row._id} className="font-medium text-red-950">
                    <td className="px-3 py-2">{row.mobileLabel}</td>
                    <td className="px-3 py-2">{row.category}</td>
                    <td className="px-3 py-2">{row.quality}</td>
                    <td className="px-3 py-2 font-black">{row.stock}</td>
                    <td className="px-3 py-2">₹{row.sellingPrice.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
