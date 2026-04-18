"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const IST = "Asia/Kolkata";

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: IST,
  }).format(d);
}

function formatMonthKey(key) {
  if (!key || typeof key !== "string") return "—";
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(d);
}

export default function SalesSystemDashboardPage() {
  const [stats, setStats] = useState(null);
  const [invStats, setInvStats] = useState(null);
  const [error, setError] = useState("");
  const [seedMsg, setSeedMsg] = useState("");
  const [seedLoading, setSeedLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [stockSearch, setStockSearch] = useState("");
  const stockSearchDebounced = useDebounced(stockSearch, 320);
  const [stockCategoryId, setStockCategoryId] = useState("");
  const [stockQuality, setStockQuality] = useState("");
  const [partsStockResults, setPartsStockResults] = useState([]);
  const [shopStockResults, setShopStockResults] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockHint, setStockHint] = useState("Type at least one keyword, or choose a category / quality.");

  const load = useCallback(async () => {
    setError("");
    try {
      const [res, invRes] = await Promise.all([fetch("/api/admin/summary"), fetch("/api/inventory/dashboard")]);
      const json = await res.json();
      const invJson = await invRes.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setStats(json);
      if (invRes.ok) setInvStats(invJson);
      else setInvStats(null);
    } catch (e) {
      setError(e.message || "Failed loading dashboard");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, qRes] = await Promise.all([fetch("/api/categories"), fetch("/api/product-qualities")]);
        const catJson = await catRes.json();
        const qJson = await qRes.json();
        if (catRes.ok) setCategories(catJson.categories || []);
        if (qRes.ok) setQualities(qJson.qualities || []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const runStockLookup = useCallback(async () => {
    const q = stockSearchDebounced.trim();
    const hasFilter = Boolean(stockCategoryId || stockQuality);
    if (q.length < 1 && !hasFilter) {
      setPartsStockResults([]);
      setShopStockResults([]);
      setStockHint("Type at least one keyword, or choose a category / quality.");
      return;
    }
    setStockHint("");
    setStockLoading(true);
    try {
      const pParams = new URLSearchParams();
      if (q) pParams.set("q", q);
      if (stockCategoryId) pParams.set("categoryId", stockCategoryId);
      if (stockQuality) pParams.set("quality", stockQuality);

      const sParams = new URLSearchParams();
      if (q) sParams.set("search", q);
      if (stockCategoryId) sParams.set("category", stockCategoryId);
      if (stockQuality) sParams.set("quality", stockQuality);

      const [pRes, sRes] = await Promise.all([
        fetch(`/api/inventory/search?${pParams.toString()}`),
        fetch(`/api/products?${sParams.toString()}`),
      ]);
      const pJson = await pRes.json();
      const sJson = await sRes.json();
      if (!pRes.ok) throw new Error(pJson.error || "Parts search failed");
      setPartsStockResults(Array.isArray(pJson.results) ? pJson.results : []);
      setShopStockResults(Array.isArray(sJson.products) ? sJson.products.slice(0, 50) : []);
    } catch (e) {
      setPartsStockResults([]);
      setShopStockResults([]);
      setStockHint(e.message || "Search failed");
    } finally {
      setStockLoading(false);
    }
  }, [stockSearchDebounced, stockCategoryId, stockQuality]);

  useEffect(() => {
    void runStockLookup();
  }, [runStockLookup]);

  async function runDemoSeed() {
    setSeedLoading(true);
    setSeedMsg("");
    try {
      const res = await fetch("/api/admin/seed-parts-demo", { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Seed failed");
      setSeedMsg(j.skipped ? j.message : `${j.message} (${j.partsPurchaseLinesCreated ?? 0} purchase lines, ${j.shopSalesCreated ?? 0} sales).`);
      await load();
    } catch (e) {
      setSeedMsg(e.message || "Failed");
    } finally {
      setSeedLoading(false);
    }
  }

  const mh = invStats?.monthHighlights;
  const monthly = invStats?.monthlyOverview ?? [];
  const suppliers = invStats?.supplierSummary ?? [];

  const totals12 = useMemo(() => {
    return monthly.reduce(
      (a, r) => {
        a.parts += Number(r.partsPurchaseTotal || 0);
        a.sales += Number(r.shopSalesTotal || 0);
        return a;
      },
      { parts: 0, sales: 0 }
    );
  }, [monthly]);

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-black">Overview</h1>
          <p className="mt-1 max-w-xl text-sm text-black/60">
            Monthly parts purchases vs shop sales, parts stock, and suppliers. Open a supplier for full profile: every
            purchase line, returns, and add more entries.
          </p>
        </div>
        <div className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-right text-[11px] text-black/55">
          <div>
            <span className="font-semibold text-black/70">Updated</span>{" "}
            {invStats?.generatedAt ? formatDateTime(invStats.generatedAt) : "—"}
          </div>
          {invStats?.timezoneLabel ? <div>Months use {invStats.timezoneLabel}</div> : null}
        </div>
      </div>

      {error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      {/* Stock check — top */}
      <section className="mt-6 rounded-2xl border-2 border-brand/25 bg-gradient-to-b from-brand/5 to-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-black">Stock check</h2>
            <p className="text-xs text-black/55">
              Search <strong>parts ledger</strong> and <strong>shop SKUs</strong>. Filters apply to both. Green = quantity
              available, red = zero.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setStockSearch("");
              setStockCategoryId("");
              setStockQuality("");
              setPartsStockResults([]);
              setShopStockResults([]);
              setStockHint("Type at least one keyword, or choose a category / quality.");
            }}
            className="text-xs font-semibold text-brand-dim hover:underline"
          >
            Clear
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="min-w-0 flex-1 lg:min-w-[14rem]">
            <label className="text-xs font-bold uppercase text-black/45">Search</label>
            <input
              type="search"
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              placeholder="e.g. iphone 12, display, back panel…"
              className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
              autoComplete="off"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="text-xs font-bold uppercase text-black/45">Category</label>
            <select
              value={stockCategoryId}
              onChange={(e) => setStockCategoryId(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-44">
            <label className="text-xs font-bold uppercase text-black/45">Quality</label>
            <select
              value={stockQuality}
              onChange={(e) => setStockQuality(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              <option value="">All qualities</option>
              {qualities.map((q) => (
                <option key={q._id} value={q.name}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {stockHint ? <p className="mt-3 text-sm text-black/50">{stockHint}</p> : null}
        {stockLoading ? <p className="mt-3 text-sm text-black/50">Searching…</p> : null}

        {!stockLoading && !stockHint ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-black/10 bg-white/80 p-4">
              <h3 className="text-sm font-bold text-black">Parts ledger</h3>
              <p className="text-[11px] text-black/45">Net stock from purchases, returns, and linked sales.</p>
              {partsStockResults.length === 0 ? (
                <p className="mt-3 text-sm text-black/50">No matching parts lines.</p>
              ) : (
                <ul className="mt-3 space-y-3 text-sm">
                  {partsStockResults.map((block) => (
                    <li key={block.label} className="rounded-lg border border-black/10 bg-zinc-50/80 px-3 py-2">
                      <p className="font-semibold text-black">{block.label}</p>
                      <ul className="mt-2 space-y-1.5">
                        {(block.qualities || []).map((row) => {
                          const n = Number(row.netStock ?? 0);
                          const ok = n > 0;
                          return (
                            <li
                              key={`${block.label}-${row.quality}-${row.stockGroupId}`}
                              className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-1.5 last:border-0 last:pb-0"
                            >
                              <span>
                                {row.quality}
                                <span className="text-black/45"> · {row.categoryName || "—"}</span>
                              </span>
                              <span className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                    ok ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {ok ? `In stock (${n})` : "No stock"}
                                </span>
                                {row.categoryId ? (
                                  <Link
                                    href={`/admin/sales-system/inventory/category/${row.categoryId}`}
                                    className="text-[11px] font-bold text-brand-dim hover:underline"
                                  >
                                    Category inventory →
                                  </Link>
                                ) : null}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-xl border border-black/10 bg-white/80 p-4">
              <h3 className="text-sm font-bold text-black">Shop catalogue</h3>
              <p className="text-[11px] text-black/45">Website products (SKU stock field).</p>
              {shopStockResults.length === 0 ? (
                <p className="mt-3 text-sm text-black/50">No matching shop products.</p>
              ) : (
                <ul className="mt-3 divide-y divide-black/10 rounded-lg border border-black/10">
                  {shopStockResults.map((p) => {
                    const st = Number(p.stock ?? 0);
                    const ok = st > 0;
                    const label = [p.brand, p.model].filter(Boolean).join(" ").trim() || p.name;
                    return (
                      <li key={p._id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                        <div>
                          <p className="font-semibold text-black">{p.name}</p>
                          <p className="text-xs text-black/45">
                            {label}
                            {p.category ? ` · ${p.category}` : ""} · {p.quality}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              ok ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {ok ? `${st} pcs` : "Out of stock"}
                          </span>
                          <Link
                            href={`/admin/products/${p._id}/edit`}
                            className="text-[11px] font-bold text-brand-dim hover:underline"
                          >
                            Edit SKU →
                          </Link>
                          <Link href={`/product/${p._id}`} className="text-[11px] font-semibold text-black/45 hover:underline">
                            View site
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </section>

      {/* This month */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-900/70">Parts purchased (this month)</p>
          <p className="mt-2 text-2xl font-black text-blue-950">
            ₹{Number(mh?.partsPurchaseTotal ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-blue-900/65">{mh?.month ? formatMonthKey(mh.month) : "—"} · {mh?.partsLines ?? 0} lines</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-900/70">Shop sales (this month)</p>
          <p className="mt-2 text-2xl font-black text-emerald-950">
            ₹{Number(mh?.shopSalesTotal ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-emerald-900/65">{mh?.shopSalesCount ?? 0} sale bills</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-black/45">Parts stock (net units)</p>
          <p className="mt-2 text-2xl font-black text-black">
            {invStats?.totalPartsStock != null ? invStats.totalPartsStock.toLocaleString("en-IN") : "—"}
          </p>
          <p className="mt-1 text-xs text-black/50">Purchased − returns − sold (parts ledger)</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-black/45">Suppliers</p>
          <p className="mt-2 text-2xl font-black text-black">{invStats?.supplierCount ?? "—"}</p>
          <p className="mt-1 text-xs text-black/50">Click a card below for full activity</p>
        </div>
      </div>

      {/* 12-month table */}
      <section className="mt-10 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-black">Last 12 months</h2>
        <p className="mt-1 text-xs text-black/50">
          Parts = supplier purchase lines (₹). Shop = catalogue sales (₹). Rolling window:{" "}
          <strong>₹{totals12.parts.toLocaleString("en-IN")}</strong> parts,{" "}
          <strong>₹{totals12.sales.toLocaleString("en-IN")}</strong> shop.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-black/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase text-black/45">
              <tr>
                <th className="px-3 py-2">Month</th>
                <th className="px-3 py-2">Parts purchased ₹</th>
                <th className="px-3 py-2">Lines</th>
                <th className="px-3 py-2">Units in</th>
                <th className="px-3 py-2">Shop sales ₹</th>
                <th className="px-3 py-2">Sale count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {[...monthly].reverse().map((row) => (
                <tr key={row.month} className={row.month === mh?.month ? "bg-brand/10" : ""}>
                  <td className="px-3 py-2 font-medium text-black">{formatMonthKey(row.month)}</td>
                  <td className="px-3 py-2 tabular-nums">₹{Number(row.partsPurchaseTotal || 0).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2 tabular-nums">{row.partsLines}</td>
                  <td className="px-3 py-2 tabular-nums">{row.partsUnits}</td>
                  <td className="px-3 py-2 tabular-nums font-medium text-emerald-900">
                    ₹{Number(row.shopSalesTotal || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{row.shopSalesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {monthly.length === 0 ? <p className="p-6 text-center text-sm text-black/50">No monthly data yet.</p> : null}
        </div>
      </section>

      {/* Suppliers — drill-down */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-black">Suppliers (open profile)</h2>
        <p className="mt-1 text-xs text-black/50">
          Each page lists all purchase lines, returns, and forms to add purchases or returns.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <Link
              key={s._id}
              href={`/admin/sales-system/suppliers/${s._id}`}
              className="block rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition hover:border-brand hover:shadow-md"
            >
              <p className="font-bold text-black">{s.name}</p>
              <p className="mt-2 text-xs text-black/50">
                Purchased <span className="font-semibold text-black">₹{Number(s.totalPurchasedAmount || 0).toLocaleString("en-IN")}</span>
                {" · "}
                {s.purchaseLineCount} lines
              </p>
              <p className="mt-1 text-xs text-black/50">
                Returns <span className="font-semibold text-amber-800">{s.totalReturnedUnits}</span> units · Net in{" "}
                <span className="font-semibold text-black">{s.netUnitsFromSupplier}</span>
              </p>
              <p className="mt-2 text-[11px] text-black/40">
                Last purchase: {s.lastPurchaseAt ? formatDateTime(s.lastPurchaseAt) : "—"}
              </p>
              <p className="mt-3 text-xs font-bold text-brand-dim">Open profile →</p>
            </Link>
          ))}
        </div>
        {suppliers.length === 0 ? <p className="mt-4 text-sm text-black/50">No suppliers yet.</p> : null}
      </section>

      {/* Parts low stock */}
      {invStats?.lowStockItems?.length ? (
        <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/25 p-5">
          <h2 className="text-lg font-bold text-amber-950">Parts low stock</h2>
          <p className="mt-1 text-xs text-amber-900/70">Below {5} net units — restock or buy.</p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-amber-200/80 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-amber-100/50 text-xs font-bold uppercase text-amber-950/80">
                <tr>
                  <th className="px-3 py-2">Mobile</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Quality</th>
                  <th className="px-3 py-2">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {invStats.lowStockItems.slice(0, 25).map((row) => (
                  <tr key={row._id}>
                    <td className="px-3 py-2">{row.mobileName || "—"}</td>
                    <td className="px-3 py-2 font-medium">{row.productName}</td>
                    <td className="px-3 py-2">{row.categoryName || "—"}</td>
                    <td className="px-3 py-2">{row.quality}</td>
                    <td className="px-3 py-2 font-black tabular-nums">{row.netStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Quick actions */}
      <section className="mt-10 flex flex-wrap gap-3 rounded-2xl border border-black/10 bg-zinc-50 p-4">
        <Link
          href="/admin/sales-system/sales"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-bold text-black"
        >
          New sale
        </Link>
        <Link
          href="/admin/sales-system/suppliers"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/15 bg-white px-5 text-sm font-semibold text-black"
        >
          All suppliers
        </Link>
        <Link
          href="/admin/sales-system/returns"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/15 bg-white px-5 text-sm font-semibold text-black"
        >
          Returns
        </Link>
        <Link
          href="/admin/sales-system/inventory"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/15 bg-white px-5 text-sm font-semibold text-black"
        >
          Inventory by category
        </Link>
        <Link href="/admin/inventory" className="inline-flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-semibold text-brand-dim hover:underline">
          Shop stock (catalogue)
        </Link>
      </section>

      {/* Demo data */}
      <section className="mt-10 rounded-2xl border border-dashed border-black/20 bg-white p-5">
        <h2 className="text-sm font-bold text-black">Testing: demo parts + sales</h2>
        <p className="mt-1 text-xs text-black/55">
          Adds sample <strong>parts purchase lines</strong> (spread across months) and <strong>shop sales</strong> if you have
          categories, suppliers, and at least one product. Set <code className="rounded bg-zinc-100 px-1">ALLOW_PARTS_DEMO_SEED=true</code> in{" "}
          <code className="rounded bg-zinc-100 px-1">.env.local</code> and restart the dev server, then click below. Safe to run once;
          re-run after deleting rows with notes <code className="rounded bg-zinc-100 px-1">__demoDashboard</code>.
        </p>
        <button
          type="button"
          disabled={seedLoading}
          onClick={runDemoSeed}
          className="mt-3 min-h-11 rounded-full border border-black/20 bg-zinc-100 px-5 text-sm font-bold text-black disabled:opacity-50"
        >
          {seedLoading ? "Seeding…" : "Load demo data"}
        </button>
        {seedMsg ? <p className="mt-3 text-sm text-black/75">{seedMsg}</p> : null}
      </section>

      {/* Shop reference */}
      {stats?.lowStockItems?.length ? (
        <section className="mt-10 rounded-2xl border border-red-200 bg-red-50/30 p-5">
          <h2 className="text-lg font-bold text-red-900">Shop catalogue — low stock</h2>
          <p className="mt-1 text-xs text-red-900/70">Website SKUs with stock &lt; 5 (not parts ledger).</p>
          <ul className="mt-3 space-y-1 text-sm text-red-950">
            {stats.lowStockItems.slice(0, 12).map((row) => (
              <li key={row._id}>
                <span className="font-semibold">{row.mobileLabel}</span> · {row.category} · {row.quality} ·{" "}
                <span className="font-bold">{row.stock}</span> pcs · ₹{row.sellingPrice.toLocaleString("en-IN")}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
