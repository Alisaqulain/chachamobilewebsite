"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

const IST = "Asia/Kolkata";

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

function formatDayKey(day) {
  if (!day || typeof day !== "string") return "—";
  const [y, m, dd] = day.split("-").map(Number);
  if (!y || !m || !dd) return day;
  const d = new Date(Date.UTC(y, m - 1, dd));
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: IST,
  }).format(d);
}

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
  const [invStats, setInvStats] = useState(null);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput, 320);
  const [categorySlug, setCategorySlug] = useState("");
  const [quality, setQuality] = useState("");
  const [qualityOptions, setQualityOptions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [partsSearchInput, setPartsSearchInput] = useState("");
  const partsSearch = useDebounced(partsSearchInput, 320);
  const [partsCatId, setPartsCatId] = useState("");
  const [partsQuality, setPartsQuality] = useState("");
  const [partsResults, setPartsResults] = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [res, invRes] = await Promise.all([fetch("/api/admin/summary"), fetch("/api/inventory/dashboard")]);
        const json = await res.json();
        const invJson = await invRes.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        setStats(json);
        if (invRes.ok) setInvStats(invJson);
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

  const runPartsSearch = useCallback(async () => {
    setPartsLoading(true);
    try {
      const params = new URLSearchParams();
      if (partsSearch.trim()) params.set("q", partsSearch.trim());
      if (partsCatId) params.set("categoryId", partsCatId);
      if (partsQuality) params.set("quality", partsQuality);
      const res = await fetch(`/api/inventory/search?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Parts search failed");
      setPartsResults(json.results || []);
    } catch {
      setPartsResults([]);
    } finally {
      setPartsLoading(false);
    }
  }, [partsSearch, partsCatId, partsQuality]);

  useEffect(() => {
    void runPartsSearch();
  }, [runPartsSearch]);

  const grouped = useMemo(() => groupByMobile(searchResults), [searchResults]);

  const todayIstLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        dateStyle: "full",
        timeZone: IST,
      }).format(new Date()),
    []
  );

  const purchasesByDay = invStats?.purchasesByDay ?? [];
  const purchases14dTotals = useMemo(() => {
    return purchasesByDay.reduce(
      (acc, row) => {
        acc.lines += row.lines || 0;
        acc.units += row.units || 0;
        acc.amount += Number(row.amount || 0);
        return acc;
      },
      { lines: 0, units: 0, amount: 0 }
    );
  }, [purchasesByDay]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-black">Sales Dashboard</h1>
      <p className="mt-1 text-sm text-black/60">
        Search stock by mobile name, filter by category and quality. Website catalogue is separate.
      </p>
      <p className="mt-2 rounded-xl border border-black/10 bg-zinc-50 px-4 py-2.5 text-xs text-black/65">
        <span className="font-bold text-black/80">Data snapshot: </span>
        {invStats?.generatedAt ? formatDateTime(invStats.generatedAt) : "—"}
        {invStats?.timezoneLabel ? (
          <span className="text-black/50"> · Parts rollups use {invStats.timezoneLabel}</span>
        ) : null}
        <span className="mx-2 text-black/25">|</span>
        <span className="font-bold text-black/80">Today (IST): </span>
        {todayIstLabel}
      </p>

      {error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-black/45">Parts stock (units)</p>
          <p className="mt-2 text-3xl font-black text-black">
            {invStats?.totalPartsStock != null ? invStats.totalPartsStock.toLocaleString("en-IN") : "—"}
          </p>
          <p className="mt-2 text-[11px] leading-snug text-black/45">Net on hand: purchased − returns − sold (parts ledger).</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-black/45">Suppliers</p>
          <p className="mt-2 text-3xl font-black text-black">{invStats?.supplierCount ?? stats?.supplierCount ?? "—"}</p>
          <p className="mt-2 text-[11px] text-black/45">Parties you buy parts from.</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-900/80">Parts low stock</p>
          <p className="mt-2 text-3xl font-black text-amber-900">{invStats?.lowStockCount ?? "—"}</p>
          <p className="mt-2 text-[11px] text-amber-900/70">Parts lines with net stock below {5} units.</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-black/45">Shop products</p>
          <p className="mt-2 text-3xl font-black text-black">{stats?.productCount ?? "—"}</p>
          <p className="mt-2 text-[11px] text-black/45">SKUs on the public website catalogue.</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-black/45">Shop stock (units)</p>
          <p className="mt-2 text-3xl font-black text-black">
            {stats?.totalStock != null ? stats.totalStock.toLocaleString("en-IN") : "—"}
          </p>
          <p className="mt-2 text-[11px] text-black/45">Sum of stock field on website products.</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-red-800/80">Shop low stock</p>
          <p className="mt-2 text-3xl font-black text-red-700">{stats?.lowStockCount ?? "—"}</p>
          <p className="mt-2 text-[11px] text-red-800/70">Website SKUs with stock &lt; 5.</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm sm:col-span-2 xl:col-span-1 2xl:col-span-1">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-900/80">Today&apos;s shop sales</p>
          <p className="mt-2 text-3xl font-black text-emerald-950">{stats?.todaySalesCount ?? "—"}</p>
          <p className="mt-1 text-sm font-semibold text-emerald-900/80">
            ₹{Number(stats?.todaySalesAmount ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-[11px] leading-snug text-emerald-900/65">
            Calendar day in server time when the sale was saved. For strict IST reporting, align server TZ or use reports.
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
          Inventory by category
        </Link>
        <Link
          href="/admin/sales-system/suppliers"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/15 px-5 text-sm font-semibold text-black"
        >
          Suppliers
        </Link>
      </div>

      {invStats ? (
        <section className="mt-10 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-black">Parts — analysis (last 14 days)</h2>
          <p className="mt-1 text-xs text-black/50">
            Purchase lines counted by calendar day ({IST}). Totals this window:{" "}
            <strong>{purchases14dTotals.lines}</strong> lines, <strong>{purchases14dTotals.units}</strong> units,{" "}
            <strong>₹{purchases14dTotals.amount.toLocaleString("en-IN")}</strong>.
          </p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold text-black">By day</h3>
              <div className="mt-2 overflow-x-auto rounded-xl border border-black/10">
                {purchasesByDay.length === 0 ? (
                  <p className="p-6 text-center text-sm text-black/50">No parts purchases in this window.</p>
                ) : (
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-xs font-bold uppercase text-black/45">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Lines</th>
                        <th className="px-3 py-2">Units</th>
                        <th className="px-3 py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {purchasesByDay.map((row) => (
                        <tr key={row.day}>
                          <td className="px-3 py-2 whitespace-nowrap text-black">{formatDayKey(row.day)}</td>
                          <td className="px-3 py-2 tabular-nums">{row.lines}</td>
                          <td className="px-3 py-2 tabular-nums">{row.units}</td>
                          <td className="px-3 py-2 font-medium tabular-nums">₹{Number(row.amount || 0).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-black">Latest purchase lines</h3>
              <div className="mt-2 overflow-x-auto rounded-xl border border-black/10">
                {(invStats?.recentPartsPurchases ?? []).length === 0 ? (
                  <p className="p-6 text-center text-sm text-black/50">No recent purchases.</p>
                ) : (
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-xs font-bold uppercase text-black/45">
                      <tr>
                        <th className="px-3 py-2">Date / time</th>
                        <th className="px-3 py-2">Supplier</th>
                        <th className="px-3 py-2">Product</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {(invStats?.recentPartsPurchases ?? []).map((row) => (
                        <tr key={row._id}>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-black/80">{formatDateTime(row.date)}</td>
                          <td className="px-3 py-2 font-medium">{row.supplierName}</td>
                          <td className="px-3 py-2">
                            <span className="font-semibold">{row.productName}</span>
                            {row.mobileName ? (
                              <span className="text-black/45"> · {row.mobileName}</span>
                            ) : null}
                            {row.categoryName ? (
                              <span className="block text-[11px] text-black/40">
                                {row.categoryName} · {row.quality}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 tabular-nums">{row.quantity}</td>
                          <td className="px-3 py-2 font-semibold tabular-nums">
                            ₹{Number(row.lineTotal || 0).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-bold text-black">Latest parts returns</h3>
            <p className="mt-1 text-xs text-black/50">Return-to-supplier movements (stock reduced).</p>
            <div className="mt-2 overflow-x-auto rounded-xl border border-black/10">
              {(invStats?.recentPartsReturns ?? []).length === 0 ? (
                <p className="p-6 text-center text-sm text-black/50">No returns recorded yet.</p>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-xs font-bold uppercase text-black/45">
                    <tr>
                      <th className="px-3 py-2">Date / time</th>
                      <th className="px-3 py-2">Supplier</th>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {(invStats?.recentPartsReturns ?? []).map((row) => (
                      <tr key={row._id}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">{formatDateTime(row.date)}</td>
                        <td className="px-3 py-2 font-medium">{row.supplierName}</td>
                        <td className="px-3 py-2">{row.productName}</td>
                        <td className="px-3 py-2 tabular-nums font-semibold">{row.quantity}</td>
                        <td className="px-3 py-2 text-black/55">{row.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {invStats?.supplierSummary?.length ? (
        <section className="mt-8 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-black">Supplier summary</h2>
          <p className="mt-1 text-xs text-black/50">
            Lifetime purchased value and line counts; returns and net units from all parts purchase lines. Last purchase
            is the newest line date for that supplier.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
                <tr>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2">Last purchase</th>
                  <th className="px-3 py-2">Purchased ₹</th>
                  <th className="px-3 py-2">Lines</th>
                  <th className="px-3 py-2">Returned qty</th>
                  <th className="px-3 py-2">Net units in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {invStats.supplierSummary.map((s) => (
                  <tr key={s._id}>
                    <td className="px-3 py-2 font-semibold text-black">{s.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black/75">
                      {s.lastPurchaseAt ? formatDateTime(s.lastPurchaseAt) : "—"}
                    </td>
                    <td className="px-3 py-2">₹{Number(s.totalPurchasedAmount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2">{s.purchaseLineCount}</td>
                    <td className="px-3 py-2">{s.totalReturnedUnits}</td>
                    <td className="px-3 py-2 font-bold">{s.netUnitsFromSupplier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {invStats?.lowStockItems?.length ? (
        <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/30 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-amber-950">Parts low stock (detail)</h2>
          <p className="mt-1 text-xs text-amber-900/70">
            Net stock below {5} units on the parts ledger (same count as the amber KPI card). Sorted by lowest first.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-amber-200/80 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-amber-100/60 text-xs font-bold uppercase text-amber-950/80">
                <tr>
                  <th className="px-3 py-2">Mobile</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Quality</th>
                  <th className="px-3 py-2">Net stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {invStats.lowStockItems.map((row) => (
                  <tr key={row._id} className="font-medium text-amber-950">
                    <td className="px-3 py-2">{row.mobileName || "—"}</td>
                    <td className="px-3 py-2">{row.productName}</td>
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

      {/* Parts ledger search */}
      <section className="mt-10 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-black">Parts inventory search</h2>
        <p className="mt-1 text-xs text-black/50">
          Type words in any order (e.g. display iphone 12). Filters use category and quality from your lists.
        </p>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <label className="text-xs font-bold uppercase text-black/45">Search</label>
            <input
              type="search"
              value={partsSearchInput}
              onChange={(e) => setPartsSearchInput(e.target.value)}
              placeholder="Search (display iphone 12)"
              className="mt-1 w-full min-h-14 rounded-2xl border-2 border-black/10 px-4 text-base outline-none focus:border-brand"
              autoComplete="off"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="text-xs font-bold uppercase text-black/45">Category</label>
            <select
              value={partsCatId}
              onChange={(e) => setPartsCatId(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label className="text-xs font-bold uppercase text-black/45">Quality</label>
            <select
              value={partsQuality}
              onChange={(e) => setPartsQuality(e.target.value)}
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
          {partsLoading ? (
            <p className="text-sm text-black/50">Loading…</p>
          ) : partsResults.length === 0 ? (
            <p className="rounded-xl border border-dashed border-black/15 bg-zinc-50 px-4 py-8 text-center text-sm text-black/50">
              No matching parts lines.
            </p>
          ) : (
            <div className="space-y-3">
              {partsResults.map((block) => (
                <div key={block.label} className="rounded-xl border border-black/10 bg-zinc-50/80 px-4 py-3">
                  <p className="font-bold text-black">{block.label}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {block.qualities.map((q) => (
                      <li key={q.stockGroupId} className="flex justify-between gap-2 border-b border-black/5 py-1 last:border-0">
                        <span>
                          {q.quality}
                          <span className="text-black/45"> · {q.categoryName}</span>
                        </span>
                        <span className="font-bold tabular-nums">{q.netStock} stock</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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
