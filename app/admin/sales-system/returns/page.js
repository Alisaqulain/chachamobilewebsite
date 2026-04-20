"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import DownloadExports from "@/components/admin/DownloadExports";

function supplierLabel(name) {
  const n = String(name || "").trim();
  return n || "Unknown supplier";
}

export default function SalesSystemPartsReturnsPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lineSearch, setLineSearch] = useState("");
  const [returnFor, setReturnFor] = useState(null);
  const [returnQty, setReturnQty] = useState("1");
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [returnNotes, setReturnNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSuppliers = useCallback(async () => {
    setSuppliersLoading(true);
    setError("");
    try {
      const res = await fetch("/api/suppliers");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load suppliers");
      setSuppliers(j.suppliers || []);
    } catch (e) {
      setError(e.message || "Failed to load suppliers");
      setSuppliers([]);
    } finally {
      setSuppliersLoading(false);
    }
  }, []);

  const loadPurchases = useCallback(async (supplierId) => {
    if (!supplierId) return;
    setPurchasesLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/inventory/parts-purchases?supplierId=${encodeURIComponent(supplierId)}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load purchases");
      setPurchases(j.purchases || []);
    } catch (e) {
      setError(e.message || "Failed to load purchases");
      setPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  useEffect(() => {
    if (!selectedSupplier) {
      setPurchases([]);
      setLineSearch("");
      return;
    }
    void loadPurchases(selectedSupplier._id);
  }, [selectedSupplier, loadPurchases]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3200);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (!returnFor) return;
    const max = Math.max(0, Number(returnFor.returnableQty ?? 0));
    setReturnQty(String(max > 0 ? Math.min(max, 1) : 1));
    setReturnDate(new Date().toISOString().slice(0, 10));
    setReturnNotes("");
  }, [returnFor]);

  const filteredSuppliers = useMemo(() => {
    const q = supplierSearch.trim().toLowerCase();
    const list = [...suppliers].sort((a, b) => supplierLabel(a.name).localeCompare(supplierLabel(b.name)));
    if (!q) return list;
    return list.filter((s) => supplierLabel(s.name).toLowerCase().includes(q));
  }, [suppliers, supplierSearch]);

  const filteredLines = useMemo(() => {
    const q = lineSearch.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter((p) => {
      const blob = [p.productName, p.mobileName, p.salesCategoryName, p.quality].join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [purchases, lineSearch]);

  const exportColumns = useMemo(
    () => [
      { header: "Date", key: "date", width: 12 },
      { header: "Folder", key: "folder", width: 16 },
      { header: "Model", key: "model", width: 26 },
      { header: "Sales category", key: "salesCategory", width: 18 },
      { header: "Quality", key: "quality", width: 12 },
      { header: "Bought", key: "bought", width: 8 },
      { header: "Returned", key: "returned", width: 8 },
      { header: "Returnable", key: "returnable", width: 10 },
    ],
    []
  );

  const exportRows = useMemo(
    () =>
      (filteredLines || []).map((row) => {
        const ret = Number(row.returnedQty ?? 0);
        const can = Math.max(0, Number(row.returnableQty ?? row.quantity - ret));
        return {
          date: row.date ? new Date(row.date).toLocaleDateString() : "—",
          folder: row.mobileName || "—",
          model: row.productName || "—",
          salesCategory: row.salesCategoryName || "—",
          quality: row.quality || "—",
          bought: String(row.quantity ?? ""),
          returned: String(ret),
          returnable: String(can),
        };
      }),
    [filteredLines]
  );

  function clearSupplier() {
    setSelectedSupplier(null);
    setReturnFor(null);
    setError("");
  }

  async function submitReturn(e) {
    e.preventDefault();
    if (!returnFor || !selectedSupplier) return;
    const max = Math.max(0, Number(returnFor.returnableQty ?? 0));
    const qty = Number(returnQty);
    if (!Number.isFinite(qty) || qty < 1) {
      setError("Enter a valid return quantity");
      return;
    }
    if (qty > max) {
      setError(`Max returnable for this line is ${max}`);
      return;
    }
    const purchasedTotal = Number(returnFor.quantity);
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/inventory/parts-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partsPurchaseId: returnFor._id,
          quantity: qty,
          date: returnDate,
          notes: returnNotes.trim(),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Return failed");
      const remaining = max - qty;
      setReturnFor(null);
      setNotice(
        `Return recorded · ${remaining} unit(s) still returnable on this line (${purchasedTotal} purchased in total).`
      );
      await loadPurchases(selectedSupplier._id);
    } catch (e2) {
      setError(e2.message || "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-black">Purchase returns (parts)</h1>
      <p className="mt-1 text-sm text-black/60">
        Choose a supplier, then record returns against their purchase lines. <strong>Returnable</strong> is what is
        left after returns already posted (e.g. bought 20, returned 5 → 15 left).
      </p>

      <p className="mt-3 text-sm text-black/55">
        Add purchases under{" "}
        <Link href="/admin/sales-system/suppliers" className="font-semibold text-brand-dim hover:underline">
          Suppliers
        </Link>
        . Catalogue SKU returns:{" "}
        <Link href="/admin/returns" className="font-semibold text-brand-dim hover:underline">
          Legacy returns
        </Link>
        .
      </p>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      {notice ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p>
      ) : null}

      {!selectedSupplier ? (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-black">1. Select supplier</h2>
          <p className="mt-1 text-xs text-black/50">Open a supplier to see all purchases you can return against.</p>
          <div className="mt-4">
            <label className="text-xs font-bold uppercase text-black/45">Search suppliers</label>
            <input
              type="search"
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              placeholder="Filter by name…"
              className="mt-1 w-full max-w-md min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>
          {suppliersLoading ? (
            <p className="mt-8 text-sm text-black/55">Loading suppliers…</p>
          ) : (
            <ul className="mt-6 divide-y divide-black/10 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
              {filteredSuppliers.map((s) => (
                <li key={s._id}>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSelectedSupplier({ _id: s._id, name: s.name });
                    }}
                    className="flex w-full min-h-14 items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-zinc-50"
                  >
                    <span className="font-semibold text-black">{supplierLabel(s.name)}</span>
                    {s.phone ? <span className="shrink-0 text-black/45">{s.phone}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!suppliersLoading && filteredSuppliers.length === 0 ? (
            <p className="mt-6 text-center text-sm text-black/55">No suppliers match.</p>
          ) : null}
        </section>
      ) : (
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <button
                type="button"
                onClick={clearSupplier}
                className="text-sm font-semibold text-brand-dim hover:underline"
              >
                ← All suppliers
              </button>
              <h2 className="mt-2 text-lg font-bold text-black">{supplierLabel(selectedSupplier.name)}</h2>
              <p className="mt-1 text-xs text-black/50">2. Purchase lines for this supplier — add return where needed.</p>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-bold uppercase text-black/45">Search lines</label>
            <input
              type="search"
              value={lineSearch}
              onChange={(e) => setLineSearch(e.target.value)}
              placeholder="Model, folder, quality…"
              className="mt-1 w-full max-w-md min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>

          {purchasesLoading ? (
            <p className="mt-8 text-sm text-black/55">Loading purchase lines…</p>
          ) : (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
                <p className="text-sm font-semibold text-black/70">
                  Export current list {lineSearch.trim() ? "(filtered)" : ""}
                </p>
                <DownloadExports
                  filenameBase={`purchase_returns_${selectedSupplier?.name || selectedSupplier?._id || "supplier"}`}
                  title="Purchase returns (parts)"
                  subtitle={supplierLabel(selectedSupplier?.name)}
                  metaLines={[`Rows: ${exportRows.length}`, lineSearch.trim() ? `Filter: ${lineSearch.trim()}` : ""]}
                  columns={exportColumns}
                  rows={exportRows}
                />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Folder</th>
                    <th className="px-3 py-2">Model</th>
                    <th className="px-3 py-2">Sales category</th>
                    <th className="px-3 py-2">Quality</th>
                    <th className="px-3 py-2">Bought</th>
                    <th className="px-3 py-2">Returned</th>
                    <th className="px-3 py-2">Returnable</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredLines.map((row) => {
                    const ret = Number(row.returnedQty ?? 0);
                    const can = Math.max(0, Number(row.returnableQty ?? row.quantity - ret));
                    const dim = can === 0;
                    return (
                      <tr key={row._id} className={dim ? "text-black/45" : ""}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {row.date ? new Date(row.date).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-3 py-2">{row.mobileName || "—"}</td>
                        <td className="px-3 py-2 font-semibold">{row.productName}</td>
                        <td className="px-3 py-2">{row.salesCategoryName || "—"}</td>
                        <td className="px-3 py-2">{row.quality}</td>
                        <td className="px-3 py-2 tabular-nums">{row.quantity}</td>
                        <td className="px-3 py-2 tabular-nums">{ret}</td>
                        <td className="px-3 py-2 font-bold tabular-nums text-black">{can}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            disabled={can < 1}
                            onClick={() => setReturnFor(row)}
                            className="min-h-9 rounded-lg bg-black px-3 text-xs font-bold text-brand disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Return
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!purchasesLoading && filteredLines.length === 0 ? (
                <p className="p-8 text-center text-sm text-black/55">
                  {purchases.length === 0
                    ? "No purchase lines for this supplier yet."
                    : "No lines match this search."}
                </p>
              ) : null}
              </div>
            </div>
          )}
        </section>
      )}

      {returnFor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form onSubmit={submitReturn} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-black">Return to supplier</h3>
            <p className="mt-1 text-xs text-black/55">
              <span className="font-semibold text-black">{returnFor.productName}</span>
              {returnFor.mobileName ? ` · ${returnFor.mobileName}` : null}
              <span className="block mt-1">
                {supplierLabel(selectedSupplier?.name || returnFor.supplierName)} · bought {returnFor.quantity},
                already returned {Number(returnFor.returnedQty ?? 0)}, max this return:{" "}
                <strong>{Math.max(0, Number(returnFor.returnableQty ?? 0))}</strong>
              </span>
            </p>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-black/45">Quantity</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={Math.max(1, Number(returnFor.returnableQty ?? 0))}
                  value={returnQty}
                  onChange={(e) => setReturnQty(e.target.value)}
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-black/45">Date</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-black/45">Notes (optional)</label>
                <input
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="min-h-11 flex-1 rounded-lg bg-black text-sm font-bold text-brand disabled:opacity-50"
              >
                {saving ? "Saving…" : "Submit return"}
              </button>
              <button
                type="button"
                onClick={() => setReturnFor(null)}
                className="min-h-11 flex-1 rounded-lg border text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
