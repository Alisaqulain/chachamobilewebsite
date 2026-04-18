"use client";

import ShopProductCard from "@/components/shop/ShopProductCard";
import ShopProductQuickView from "@/components/shop/ShopProductQuickView";
import { SHOP_LOCAL_FALLBACK_IMAGES } from "@/lib/partImages";
import { buildWhatsAppUrl } from "@/utils/whatsapp";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

const HERO_ALTS = [
  "Cases, chargers, and mobile accessories",
  "Repair tools and spare parts flat lay",
  "Accessories and protection — shop catalogue",
  "Hands repairing a smartphone motherboard",
  "Replacement housing — front and internal view",
  "Professional disassembly on a repair mat",
  "Camera module, PCB, and precision tools",
];

const waShopIntro = buildWhatsAppUrl(
  "Hello Chacha Mobile — I'm on your shop page. Can you help me find the right spare part?"
);

/** Desktop bento positions: 4×3 grid, large tile top-left. */
const HERO_GRID_POS = [
  "lg:col-span-2 lg:row-span-2 lg:col-start-1 lg:row-start-1",
  "lg:col-start-3 lg:row-start-1",
  "lg:col-start-4 lg:row-start-1",
  "lg:col-start-3 lg:row-start-2",
  "lg:col-start-4 lg:row-start-2",
  "lg:col-start-1 lg:row-start-3",
  "lg:col-start-2 lg:row-start-3",
];

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

  /** Lowercase so URL ?category= matches option values even if DB slug casing differs. */
  const categorySlug = (searchParams.get("category") || "").trim().toLowerCase();
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
    if (next.category) p.set("category", String(next.category).trim().toLowerCase());
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
      className="rounded-3xl border border-zinc-200/90 bg-white/95 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-zinc-900/92 dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)] lg:sticky lg:top-24 lg:self-start"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Filters</p>
      <div className="mt-6 space-y-5">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Category
          </label>
          <select
            value={categorySlug}
            onChange={onCategoryChange}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition focus:ring-4 focus:ring-brand/25 dark:border-white/12 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">All</option>
            {meta.categories.map((c) => (
              <option key={c._id} value={String(c.slug || "").toLowerCase()}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Brand
          </label>
          <select
            value={brandId}
            onChange={onBrandChange}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition focus:ring-4 focus:ring-brand/25 dark:border-white/12 dark:bg-zinc-950 dark:text-zinc-100"
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
          <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Model
          </label>
          <select
            value={modelId}
            onChange={onModelChange}
            disabled={!brandId}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition focus:ring-4 focus:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/12 dark:bg-zinc-950 dark:text-zinc-100"
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
          className="w-full rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-700 transition hover:border-brand/50 hover:text-zinc-900 disabled:opacity-40 dark:border-white/15 dark:text-zinc-200 dark:hover:text-white"
        >
          Clear filters
        </button>
      </div>
    </motion.aside>
  );

  return (
    <div className="relative mx-auto w-full max-w-[min(100%,90rem)] px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
      <div className="pointer-events-none absolute -left-20 -top-10 h-56 w-56 rounded-full bg-brand/15 blur-[90px]" />
      <div className="pointer-events-none absolute -right-16 top-20 h-48 w-48 rounded-full bg-accent/10 blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="surface-3d-hover relative overflow-hidden rounded-[2rem] border border-zinc-200/90 bg-gradient-to-br from-white via-zinc-50/90 to-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] dark:border-white/[0.08] dark:from-zinc-900 dark:via-zinc-900/95 dark:to-zinc-950 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8 lg:p-10"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10">
          <div className="min-w-0 flex-1 lg:max-w-xl lg:pt-1">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand">Shop</p>
                <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                  Premium spare parts
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setMobileFilters((v) => !v)}
                className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-brand-dim lg:hidden"
              >
                {mobileFilters ? "Hide filters" : "Filters"}
              </button>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-base">
              Live catalogue with URL-synced filters. Stack brand, model, and category like a marketplace —
              built for genuine spare SKUs, quick view, and WhatsApp checkout.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Quick view", "WhatsApp checkout", "Grade labels"].map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-zinc-900/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 ring-1 ring-zinc-900/10 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/15"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={waShopIntro}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-3d-pop inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#25D366] px-6 text-sm font-bold text-white shadow-md transition hover:bg-[#1ebe5d]"
              >
                Chat on WhatsApp
              </a>
              <a
                href="#shop-grid"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border-2 border-zinc-900 bg-transparent px-6 text-sm font-bold text-zinc-900 transition hover:bg-zinc-900 hover:text-white dark:border-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-100 dark:hover:text-zinc-900"
              >
                Browse parts
              </a>
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-3 border-t border-zinc-200/80 pt-6 dark:border-white/10">
              {[
                ["500+", "Parts SKUs"],
                ["Same day", "Dispatch goal"],
                ["₹", "Clear pricing"],
              ].map(([a, b]) => (
                <div key={b} className="text-center sm:text-left">
                  <dt className="font-display text-lg font-bold text-zinc-900 dark:text-white sm:text-xl">{a}</dt>
                  <dd className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:text-[11px]">
                    {b}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative min-h-[200px] flex-1 lg:min-h-[280px] lg:max-w-[min(100%,520px)]">
            <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 lg:text-left">
              In-store & workshop
            </p>
            <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin] sm:mx-0 lg:grid lg:h-[min(52vw,320px)] lg:max-h-[360px] lg:grid-cols-4 lg:grid-rows-3 lg:gap-2 lg:overflow-visible">
              {SHOP_LOCAL_FALLBACK_IMAGES.map((src, i) => {
                const alt = HERO_ALTS[i] || "Chacha Mobile spare parts";
                const pos = HERO_GRID_POS[i] || "";
                const isHero = i === 0;
                return (
                  <div
                    key={src}
                    className={`relative shrink-0 snap-start overflow-hidden rounded-2xl bg-zinc-200 ring-1 ring-zinc-900/10 dark:bg-zinc-800 dark:ring-white/10 ${
                      isHero
                        ? "aspect-[5/4] w-[min(72vw,280px)] sm:w-[min(60vw,320px)] lg:aspect-auto lg:h-full lg:w-auto"
                        : "aspect-square w-[120px] sm:w-[132px] lg:aspect-auto lg:h-full lg:w-auto"
                    } ${pos}`}
                  >
                    <Image
                      src={src}
                      alt={alt}
                      fill
                      className="object-cover"
                      sizes="(max-width:1024px) 280px, 33vw"
                      priority={i < 2}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      <section
        aria-label="How to shop"
        className="mt-8 grid gap-4 sm:grid-cols-3"
      >
        {[
          { t: "Filter fast", d: "Category, brand, and model narrow the list; the URL keeps your place." },
          { t: "Tap the card", d: "Open quick view for photos, price, and add to cart without leaving the grid." },
          { t: "Order on WhatsApp", d: "One tap sends your part name, model, and quantity to our desk." },
        ].map((x) => (
          <div
            key={x.t}
            className="rounded-2xl border border-zinc-200/90 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-white/[0.08] dark:bg-zinc-900/75 dark:shadow-none"
          >
            <p className="text-sm font-bold text-zinc-900 dark:text-white">{x.t}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{x.d}</p>
          </div>
        ))}
      </section>

      {loadError && (
        <p className="mt-6 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/35 dark:bg-red-950/50 dark:text-red-100">
          {loadError}
        </p>
      )}

      <form
        className="mt-8 flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3"
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
          className="min-h-12 min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm text-zinc-900 shadow-inner outline-none transition placeholder:text-zinc-400 focus:ring-4 focus:ring-brand/25 dark:border-white/12 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        <button
          type="submit"
          className="btn-3d-pop min-h-12 shrink-0 rounded-2xl bg-brand px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-dim"
        >
          Search
        </button>
      </form>

      <div
        id="shop-grid"
        className="mt-10 scroll-mt-[calc(7rem+env(safe-area-inset-top,0px))] grid gap-8 lg:grid-cols-[minmax(260px,300px)_1fr] xl:gap-12"
      >
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

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              {loading ? "Loading…" : `${filtered.length} product${filtered.length === 1 ? "" : "s"}`}
              {hasActiveFilters && !loading ? (
                <span className="text-zinc-400 dark:text-zinc-500"> · filters active</span>
              ) : null}
            </p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${categorySlug}-${brandId}-${modelId}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`grid justify-center justify-items-stretch gap-6 sm:gap-8 [grid-template-columns:repeat(auto-fill,minmax(min(100%,15rem),min(100%,20rem)))] ${pending ? "opacity-70" : ""}`}
            >
              {!loading && filtered.length === 0 ? (
                <p className="surface-3d-hover col-span-full rounded-3xl border border-dashed border-zinc-300/80 bg-white/70 py-16 text-center text-sm text-zinc-600 dark:border-white/20 dark:bg-zinc-900/50 dark:text-zinc-400">
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
