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

function formatPurchaseDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: IST,
  }).format(d);
}

export default function SalesSystemDashboardPage() {
  const [invStats, setInvStats] = useState(null);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);
  const [qualitySuggestions, setQualitySuggestions] = useState([]);
  const [stockSearch, setStockSearch] = useState("");
  const stockSearchDebounced = useDebounced(stockSearch, 320);
  const [stockSalesCategoryId, setStockSalesCategoryId] = useState("");
  const [stockQuality, setStockQuality] = useState("");
  const [partsStockResults, setPartsStockResults] = useState([]);
  const [selectedStockRowIds, setSelectedStockRowIds] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockHint, setStockHint] = useState(
    "Search matches folder, model, quality, and each line’s signature name (set on the supplier purchase form)."
  );

  const load = useCallback(async () => {
    setError("");
    try {
      const invRes = await fetch("/api/inventory/dashboard");
      const invJson = await invRes.json();
      if (!invRes.ok) throw new Error(invJson.error || "Failed");
      setInvStats(invJson);
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
        const [catRes, sugRes] = await Promise.all([
          fetch("/api/sales-categories"),
          fetch("/api/inventory/suggestions"),
        ]);
        const catJson = await catRes.json();
        const sugJson = await sugRes.json();
        if (catRes.ok) setCategories(catJson.categories || []);
        if (sugRes.ok) setQualitySuggestions(Array.isArray(sugJson.qualities) ? sugJson.qualities : []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const runStockLookup = useCallback(async () => {
    const q = stockSearchDebounced.trim();
    const hasFilter = Boolean(stockSalesCategoryId || stockQuality);
    if (q.length < 1 && !hasFilter) {
      setPartsStockResults([]);
      setStockHint(
        "Search matches folder, model, quality, and each line’s signature name (set on the supplier purchase form)."
      );
      return;
    }
    setStockHint("");
    setStockLoading(true);
    try {
      const pParams = new URLSearchParams();
      if (q) pParams.set("q", q);
      if (stockSalesCategoryId) pParams.set("salesCategoryId", stockSalesCategoryId);
      if (stockQuality) pParams.set("quality", stockQuality);

      const pRes = await fetch(`/api/inventory/search?${pParams.toString()}`);
      const pJson = await pRes.json();
      if (!pRes.ok) throw new Error(pJson.error || "Parts search failed");
      setPartsStockResults(Array.isArray(pJson.results) ? pJson.results : []);
    } catch (e) {
      setPartsStockResults([]);
      setStockHint(e.message || "Search failed");
    } finally {
      setStockLoading(false);
    }
  }, [stockSearchDebounced, stockSalesCategoryId, stockQuality]);

  useEffect(() => {
    void runStockLookup();
  }, [runStockLookup]);

  const flattenedStockRows = useMemo(() => {
    const out = [];
    for (const block of partsStockResults || []) {
      for (const row of block.qualities || []) {
        out.push({
          label: block.label,
          ...row,
        });
      }
    }
    return out;
  }, [partsStockResults]);

  useEffect(() => {
    const allowed = new Set(flattenedStockRows.map((r) => String(r.stockGroupId)));
    setSelectedStockRowIds((prev) => prev.filter((id) => allowed.has(id)));
  }, [flattenedStockRows]);

  const allStockRowsSelected = useMemo(
    () => flattenedStockRows.length > 0 && selectedStockRowIds.length === flattenedStockRows.length,
    [flattenedStockRows.length, selectedStockRowIds.length]
  );
  const selectedStockRows = useMemo(() => {
    if (!selectedStockRowIds.length) return [];
    const selectedSet = new Set(selectedStockRowIds);
    return flattenedStockRows.filter((row) => selectedSet.has(String(row.stockGroupId)));
  }, [flattenedStockRows, selectedStockRowIds]);
  const stockAllQty = useMemo(
    () => flattenedStockRows.reduce((sum, row) => sum + Number(row.netStock || 0), 0),
    [flattenedStockRows]
  );
  const stockAllAmount = useMemo(
    () => flattenedStockRows.reduce((sum, row) => sum + Number(row.stockAmount || 0), 0),
    [flattenedStockRows]
  );
  const stockSelectedQty = useMemo(
    () => selectedStockRows.reduce((sum, row) => sum + Number(row.netStock || 0), 0),
    [selectedStockRows]
  );
  const stockSelectedAmount = useMemo(
    () => selectedStockRows.reduce((sum, row) => sum + Number(row.stockAmount || 0), 0),
    [selectedStockRows]
  );
  const toggleStockSelection = useCallback((stockGroupId) => {
    const id = String(stockGroupId);
    setSelectedStockRowIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);
  const toggleSelectAllStockRows = useCallback(() => {
    setSelectedStockRowIds((prev) => {
      if (flattenedStockRows.length === 0) return [];
      if (prev.length === flattenedStockRows.length) return [];
      return flattenedStockRows.map((row) => String(row.stockGroupId));
    });
  }, [flattenedStockRows]);

  const mh = invStats?.monthHighlights;
  const monthly = invStats?.monthlyOverview ?? [];
  const suppliers = invStats?.supplierSummary ?? [];

  const totals12Parts = useMemo(() => {
    return monthly.reduce((sum, r) => sum + Number(r.partsPurchaseTotal || 0), 0);
  }, [monthly]);
  const totals12Sales = useMemo(() => {
    return monthly.reduce((sum, r) => sum + Number(r.salesTotal || 0), 0);
  }, [monthly]);

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-black">Overview</h1>
          <p className="mt-1 max-w-xl text-sm text-black/60">
            Supplier parts purchases, purchase-backed stock, and suppliers. Open a supplier for every purchase line,
            returns, and new entries.
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
              Only lines that exist on a <strong>supplier purchase</strong> (not shop catalogue). Green = in stock, red =
              zero. Search is case-insensitive (e.g. <strong>oppo</strong>, <strong>OpPo</strong>, <strong>OPPO</strong> are same).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setStockSearch("");
              setStockSalesCategoryId("");
              setStockQuality("");
              setPartsStockResults([]);
              setSelectedStockRowIds([]);
              setStockHint(
                "Search matches folder, model, quality, and each line’s signature name (set on the supplier purchase form)."
              );
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
              placeholder="e.g. reno 12, a23, display…"
              className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
              autoComplete="off"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="text-xs font-bold uppercase text-black/45">Ledger category</label>
            <select
              value={stockSalesCategoryId}
              onChange={(e) => setStockSalesCategoryId(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              <option value="">All ledger categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full min-w-0 sm:max-w-xs">
            <label className="text-xs font-bold uppercase text-black/45">Quality contains</label>
            <input
              type="search"
              value={stockQuality}
              onChange={(e) => setStockQuality(e.target.value)}
              placeholder="Type any substring…"
              list="dashboard-quality-suggestions"
              className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
              autoComplete="off"
            />
          </div>
        </div>
        <datalist id="dashboard-quality-suggestions">
          {qualitySuggestions.map((q) => (
            <option key={q} value={q} />
          ))}
        </datalist>

        {stockHint ? <p className="mt-3 text-sm text-black/50">{stockHint}</p> : null}
        {stockLoading ? <p className="mt-3 text-sm text-black/50">Searching…</p> : null}

        {!stockLoading && !stockHint ? (
          <div className="mt-5 rounded-xl border border-black/10 bg-white/80 p-4">
            <h3 className="text-sm font-bold text-black">Parts ledger</h3>
            <p className="text-[11px] text-black/45">Net stock from purchases, returns, and linked sales.</p>
            {flattenedStockRows.length > 0 ? (
              <div className="mt-3 rounded-lg border border-black/10 bg-zinc-50/70 p-2.5 text-xs text-black/70">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      checked={allStockRowsSelected}
                      onChange={toggleSelectAllStockRows}
                      className="h-4 w-4 rounded border-black/25"
                    />
                    Select all
                  </label>
                  <span>
                    All: {flattenedStockRows.length} lines · Qty: {stockAllQty.toLocaleString("en-IN")} · Amount: ₹
                    {stockAllAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="mt-1.5 font-semibold text-black/80">
                  Selected: {selectedStockRows.length} · Qty: {stockSelectedQty.toLocaleString("en-IN")} · Amount: ₹
                  {stockSelectedAmount.toLocaleString("en-IN")}
                </div>
              </div>
            ) : null}
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
                            <div className="min-w-0 flex-1">
                              <label className="inline-flex cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedStockRowIds.includes(String(row.stockGroupId))}
                                  onChange={() => toggleStockSelection(row.stockGroupId)}
                                  className="h-4 w-4 rounded border-black/25"
                                />
                                <span className="font-semibold text-black">{row.quality}</span>
                              </label>
                              <p className="mt-0.5 text-[11px] text-black/45">
                                {row.salesCategoryName || "—"} · folder: {row.folderName || "—"} · approx value: ₹
                                {Number(row.stockAmount || 0).toLocaleString("en-IN")}
                              </p>
                              <span>
                                <span className="text-black/45">
                                  Last unit rate: ₹{Number(row.lastUnitPrice || 0).toLocaleString("en-IN")}
                                </span>
                              </span>
                              <p className="mt-1 text-[11px] text-black/50">
                                Last purchase: <span className="font-semibold text-black/70">{formatPurchaseDate(row.lastPurchaseDate)}</span>
                              </p>
                            </div>
                            <span className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                  ok ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-800"
                                }`}
                              >
                                {ok ? `In stock (${n})` : "No stock"}
                              </span>
                              {row.salesCategoryId ? (
                                <Link
                                  href={`/admin/sales-system/inventory/category/${row.salesCategoryId}`}
                                  className="text-[11px] font-bold text-brand-dim hover:underline"
                                >
                                  Sales category →
                                </Link>
                              ) : null}
                              {row.folderName ? (
                                <Link
                                  href={`/admin/sales-system/inventory/folder/${encodeURIComponent(row.folderName)}`}
                                  className="text-[11px] font-bold text-brand-dim hover:underline"
                                >
                                  Folder →
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
        ) : null}
      </section>

      {/* This month */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-900/70">Parts purchased (this month)</p>
          <p className="mt-2 text-2xl font-black text-blue-950">
            ₹{Number(mh?.partsPurchaseTotal ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-blue-900/65">{mh?.month ? formatMonthKey(mh.month) : "—"} · {mh?.partsLines ?? 0} lines</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-900/70">Sales — from stock (this month)</p>
          <p className="mt-2 text-2xl font-black text-emerald-950">
            ₹{Number(mh?.salesFromStockTotal ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-emerald-900/65">
            {mh?.month ? formatMonthKey(mh.month) : "—"} · {mh?.salesFromStockBills ?? 0} bills · deducts inventory
          </p>
          <div className="mt-4 border-t border-emerald-200/80 pt-3">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-900/70">Sales — without stock (manual)</p>
            <p className="mt-1 text-xl font-black text-violet-950">
              ₹{Number(mh?.salesManualTotal ?? 0).toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-violet-900/65">{mh?.salesManualBills ?? 0} bills · bill only</p>
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-black/45">Parts stock (net units)</p>
          <p className="mt-2 text-2xl font-black text-black">
            {invStats?.totalPartsStock != null ? invStats.totalPartsStock.toLocaleString("en-IN") : "—"}
          </p>
          <p className="mt-1 text-xs text-black/50">From supplier purchases only (purchased − returns − sold)</p>
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
          Purchase and sales trend. Rolling 12 months: purchases <strong>₹{totals12Parts.toLocaleString("en-IN")}</strong>
          {" · "}sales <strong>₹{totals12Sales.toLocaleString("en-IN")}</strong>.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-black/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase text-black/45">
              <tr>
                <th className="px-3 py-2">Month</th>
                <th className="px-3 py-2">Parts purchased ₹</th>
                <th className="px-3 py-2">Sales from stock ₹</th>
                <th className="px-3 py-2">Sales manual ₹</th>
                <th className="px-3 py-2">Parts lines</th>
                <th className="px-3 py-2">Bills (stock)</th>
                <th className="px-3 py-2">Bills (manual)</th>
                <th className="px-3 py-2">Units in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {[...monthly].reverse().map((row) => (
                <tr key={row.month} className={row.month === mh?.month ? "bg-brand/10" : ""}>
                  <td className="px-3 py-2 font-medium text-black">{formatMonthKey(row.month)}</td>
                  <td className="px-3 py-2 tabular-nums">₹{Number(row.partsPurchaseTotal || 0).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2 tabular-nums">₹{Number(row.salesFromStockTotal || 0).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2 tabular-nums">₹{Number(row.salesManualTotal || 0).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2 tabular-nums">{row.partsLines}</td>
                  <td className="px-3 py-2 tabular-nums">{row.salesFromStockBills ?? 0}</td>
                  <td className="px-3 py-2 tabular-nums">{row.salesManualBills ?? 0}</td>
                  <td className="px-3 py-2 tabular-nums">{row.partsUnits}</td>
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
          <p className="mt-1 text-xs text-amber-900/70">Below {5} net units on purchase-backed lines — restock or buy.</p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-amber-200/80 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-amber-100/50 text-xs font-bold uppercase text-amber-950/80">
                <tr>
                  <th className="px-3 py-2">Folder</th>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2">Ledger category</th>
                  <th className="px-3 py-2">Quality</th>
                  <th className="px-3 py-2">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {invStats.lowStockItems.slice(0, 25).map((row) => (
                  <tr key={row._id}>
                    <td className="px-3 py-2">{row.mobileName || "—"}</td>
                    <td className="px-3 py-2 font-medium">{row.productName}</td>
                    <td className="px-3 py-2">{row.salesCategoryName || "—"}</td>
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
          Inventory by folder
        </Link>
      </section>
    </div>
  );
}
