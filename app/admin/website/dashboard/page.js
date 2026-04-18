"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function Card({ label, value, href, cta }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-black/45">{label}</p>
      <p className="mt-2 text-3xl font-black text-black">{value}</p>
      {href ? (
        <Link href={href} className="mt-4 inline-block text-sm font-semibold text-brand-dim hover:underline">
          {cta}
        </Link>
      ) : null}
    </div>
  );
}

export default function WebsiteDashboardPage() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ categories: [], brands: [], models: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [pRes, mRes] = await Promise.all([fetch("/api/products"), fetch("/api/meta/filters")]);
        const pJson = await pRes.json();
        const mJson = await mRes.json();
        if (!pRes.ok) throw new Error(pJson.error || "Failed loading products");
        if (!mRes.ok) throw new Error(mJson.error || "Failed loading filters");
        setProducts(pJson.products || []);
        setMeta({
          categories: mJson.categories || [],
          brands: mJson.brands || [],
          models: mJson.models || [],
        });
      } catch (e) {
        setError(e.message || "Failed to load website metrics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const lowStockCount = useMemo(
    () => products.filter((p) => Number(p.stock ?? 0) <= Number(p.lowStockThreshold ?? 0)).length,
    [products]
  );

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-black">Website Dashboard</h1>
      <p className="mt-1 text-sm text-black/55">
        Public shop data only. Sales vouchers and stock ledger are managed in the Sales System.
      </p>

      {error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Products" value={loading ? "..." : products.length} href="/admin/website/products" cta="Manage products ->" />
        <Card
          label="Categories"
          value={loading ? "..." : meta.categories.length}
          href="/admin/website/categories"
          cta="Manage categories ->"
        />
        <Card label="Brands" value={loading ? "..." : meta.brands.length} href="/admin/website/brands" cta="Manage brands ->" />
        <Card label="Models" value={loading ? "..." : meta.models.length} href="/admin/website/models" cta="Manage models ->" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card label="Low Stock Alerts" value={loading ? "..." : lowStockCount} href="/admin/sales-system/inventory" cta="View inventory ->" />
        <Card label="Website Scope" value="Products + Taxonomy" />
      </div>
    </div>
  );
}
