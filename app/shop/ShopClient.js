"use client";

import ShopProductCard from "@/components/shop/ShopProductCard";
import ShopProductQuickView from "@/components/shop/ShopProductQuickView";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

export default function ShopClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [mobileFilters, setMobileFilters] = useState(false);

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ categories: [], brands: [], models: [] });
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [quickView, setQuickView] = useState(null);

  const categorySlug = searchParams.get("category") || "";
  const brandId = searchParams.get("brandId") || "";
  const modelId = searchParams.get("modelId") || "";
  const legacyBrand = searchParams.get("brand") || "";
  const legacyModel = searchParams.get("model") || "";
  const search = searchParams.get("search") || "";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [pRes, mRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/meta/filters", { cache: "no-store" }),
      ]);
      const pJson = await pRes.json();
      const mJson = await mRes.json();
      if (!pRes.ok) throw new Error(pJson.error || "Failed to load products");
      if (!mRes.ok) throw new Error(mJson.error || "Failed to load filters");
      setProducts(pJson.products || []);
      setMeta({
        categories: mJson.categories || [],
        brands: mJson.brands || [],
        models: mJson.models || [],
      });
    } catch (e) {
      setLoadError(e.message || "Failed to load");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const modelsForBrand = useMemo(() => {
    if (!brandId) return [];
    return meta.models.filter((m) => m.brandId && m.brandId._id === brandId);
  }, [meta.models, brandId]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categorySlug) {
        const slug = (p.categoryId && p.categoryId.slug) || "";
        if (slug.toLowerCase() !== categorySlug.toLowerCase()) return false;
      }
      if (brandId) {
        if (p.brandId !== brandId) return false;
      } else if (legacyBrand) {
        if (p.brand?.toLowerCase() !== legacyBrand.toLowerCase()) return false;
      }
      if (modelId) {
        if (p.modelId !== modelId) return false;
      } else if (legacyModel) {
        if (p.model?.toLowerCase() !== legacyModel.toLowerCase()) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const hay = `${p.name} ${p.brand} ${p.model}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, categorySlug, brandId, modelId, legacyBrand, legacyModel, search]);

  function apply(next) {
    const p = new URLSearchParams();
    if (next.category) p.set("category", next.category);
    if (next.brandId) p.set("brandId", next.brandId);
    if (next.modelId) p.set("modelId", next.modelId);
    if (next.search) p.set("search", next.search);
    startTransition(() => {
      const qs = p.toString();
      router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
    });
  }

  function onCategoryChange(e) {
    const v = e.target.value;
    apply({ category: v, brandId, modelId, search });
  }

  function onBrandChange(e) {
    const v = e.target.value;
    apply({ category: categorySlug, brandId: v, modelId: "", search });
  }

  function onModelChange(e) {
    const v = e.target.value;
    apply({ category: categorySlug, brandId, modelId: v, search });
  }

  function clearFilters() {
    startTransition(() => router.replace("/shop", { scroll: false }));
  }

  const hasActiveFilters = Boolean(
    categorySlug || brandId || modelId || legacyBrand || legacyModel || search
  );

  const FilterSidebar = (
    <motion.aside
      initial={false}
      className="surface-3d-hover rounded-3xl border border-black/[0.06] bg-white/90 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:sticky lg:top-24 lg:self-start"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Filters</p>
      <div className="mt-6 space-y-5">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-black/40">
            Category
          </label>
          <select
            value={categorySlug}
            onChange={onCategoryChange}
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:ring-4 focus:ring-brand/20"
          >
            <option value="">All</option>
            {meta.categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-black/40">
            Brand
          </label>
          <select
            value={brandId}
            onChange={onBrandChange}
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:ring-4 focus:ring-brand/20"
          >
            <option value="">All</option>
            {meta.brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-black/40">
            Model
          </label>
          <select
            value={modelId}
            onChange={onModelChange}
            disabled={!brandId}
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:ring-4 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">All</option>
            {modelsForBrand.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="w-full rounded-2xl border border-black/10 py-3 text-sm font-semibold text-black/70 transition hover:border-brand/40 hover:text-black disabled:opacity-40"
        >
          Clear filters
        </button>
      </div>
    </motion.aside>
  );

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="pointer-events-none absolute -left-20 -top-10 h-56 w-56 rounded-full bg-brand/15 blur-[90px]" />
      <div className="pointer-events-none absolute -right-16 top-20 h-48 w-48 rounded-full bg-accent/10 blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="surface-3d-hover relative flex flex-col gap-6 overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50/80 to-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.06)] sm:flex-row sm:items-end sm:justify-between sm:p-10"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand">Shop</p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
            Premium spare parts
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            Live catalogue — filters sync to the URL. Stack brand, model, and category the same way you
            would on a consumer marketplace, tuned for parts SKUs.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Quick view", "WhatsApp checkout", "Grade labels"].map((c) => (
              <span
                key={c}
                className="rounded-full bg-zinc-900/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 ring-1 ring-zinc-900/10"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileFilters((v) => !v)}
          className="inline-flex shrink-0 items-center justify-center rounded-2xl border-2 border-zinc-900 bg-zinc-900 px-6 py-3 text-sm font-bold text-brand shadow-md transition hover:bg-zinc-800 lg:hidden"
        >
          {mobileFilters ? "Hide filters" : "Filters"}
        </button>
      </motion.div>

      {loadError && (
        <p className="mt-6 rounded-2xl border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {loadError}
        </p>
      )}

      <form
        className="mt-8 flex max-w-xl gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const q = String(fd.get("q") || "").trim();
          apply({ category: categorySlug, brandId, modelId, search: q });
        }}
      >
        <input
          name="q"
          defaultValue={search}
          placeholder="Search name, model, brand…"
          className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-white/90 px-5 py-3 text-sm shadow-inner outline-none transition focus:ring-4 focus:ring-brand/20"
        />
        <button
          type="submit"
          className="btn-3d-pop rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-brand transition hover:bg-black/90"
        >
          Search
        </button>
      </form>

      <div className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr]">
        <div className="hidden lg:block">{FilterSidebar}</div>

        <AnimatePresence>
          {mobileFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden lg:hidden"
            >
              {FilterSidebar}
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <p className="mb-4 text-sm text-white/55">
            {loading ? "Loading…" : `${filtered.length} product${filtered.length === 1 ? "" : "s"}`}
            {hasActiveFilters && !loading ? " · filters active" : ""}
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${categorySlug}-${brandId}-${modelId}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`grid gap-6 sm:grid-cols-2 xl:grid-cols-3 ${pending ? "opacity-70" : ""}`}
            >
              {!loading && filtered.length === 0 ? (
                <p className="surface-3d-hover col-span-full rounded-3xl border border-dashed border-white/20 bg-white/[0.06] py-16 text-center text-sm text-white/60">
                  No products match these filters.
                </p>
              ) : (
                filtered.map((p, i) => (
                  <ShopProductCard key={p._id} product={p} index={i} onOpenDetail={setQuickView} />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {quickView ? (
        <ShopProductQuickView key={quickView._id} product={quickView} onClose={() => setQuickView(null)} />
      ) : null}
    </div>
  );
}
