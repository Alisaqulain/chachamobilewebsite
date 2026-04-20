"use client";

import { useEffect, useMemo, useState } from "react";
import DownloadExports from "@/components/admin/DownloadExports";

function newRow(qualityDefault) {
  return {
    salesCategoryId: "",
    mobileName: "",
    productName: "",
    quality: qualityDefault || "",
    quantity: 1,
    price: 0,
  };
}

export default function AdminPurchasesPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [salesCategories, setSalesCategories] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [qualityDefault, setQualityDefault] = useState("");
  const [rows, setRows] = useState([newRow("")]);
  const [supplierId, setSupplierId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState([]);

  async function loadMaster() {
    const [sRes, cRes, qRes, hRes] = await Promise.all([
      fetch("/api/suppliers"),
      fetch("/api/sales-categories"),
      fetch("/api/product-qualities"),
      fetch("/api/inventory/parts-purchases"),
    ]);
    const sJson = await sRes.json();
    const cJson = await cRes.json();
    const qJson = await qRes.json();
    const hJson = await hRes.json();
    if (!sRes.ok) throw new Error(sJson.error || "Failed suppliers");
    if (!cRes.ok) throw new Error(cJson.error || "Failed sales categories");
    if (!qRes.ok) throw new Error(qJson.error || "Failed qualities");
    if (!hRes.ok) throw new Error(hJson.error || "Failed purchase history");
    setSuppliers(sJson.suppliers || []);
    setSalesCategories(cJson.categories || []);
    const quals = qJson.qualities || [];
    setQualities(quals);
    const def = quals[0]?.name || "";
    setQualityDefault(def);
    setRows((prev) =>
      prev.map((r) => (r.quality ? r : { ...r, quality: r.quality || def }))
    );
    setHistory(hJson.purchases || []);
  }

  useEffect(() => {
    loadMaster().catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!qualityDefault) return;
    setRows((prev) => prev.map((r) => ({ ...r, quality: r.quality || qualityDefault })));
  }, [qualityDefault]);

  const grandTotal = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.quantity || 0) * Number(r.price || 0), 0),
    [rows]
  );

  const exportColumns = useMemo(
    () => [
      { header: "Date", key: "date", width: 12 },
      { header: "Supplier", key: "supplier", width: 18 },
      { header: "Sales category", key: "salesCategory", width: 18 },
      { header: "Product", key: "product", width: 26 },
      { header: "Qty", key: "qty", width: 8 },
      { header: "Total", key: "total", width: 12 },
    ],
    []
  );

  const exportRows = useMemo(
    () =>
      (history || []).map((h) => ({
        date: h.date ? new Date(h.date).toLocaleDateString() : "—",
        supplier: h.supplierName || "—",
        salesCategory: h.salesCategoryName || "—",
        product:
          h.productName +
          (h.mobileName && h.mobileName !== "—" ? ` · ${h.mobileName}` : ""),
        qty: String(h.quantity ?? ""),
        total: `₹${Number(h.lineTotal || 0).toLocaleString("en-IN")}`,
      })),
    [history]
  );

  function updateRow(i, patch) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((r) => [...r, newRow(qualityDefault)]);
  }

  function removeRow(i) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (!supplierId) throw new Error("Select a supplier");
      if (!date) throw new Error("Choose a date");
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r.salesCategoryId) throw new Error(`Row ${i + 1}: select a sales category`);
        if (!String(r.productName || "").trim()) throw new Error(`Row ${i + 1}: enter product name`);
        if (!String(r.quality || "").trim()) throw new Error(`Row ${i + 1}: select quality`);
        if (!Number.isFinite(Number(r.quantity)) || Number(r.quantity) < 1) {
          throw new Error(`Row ${i + 1}: quantity must be at least 1`);
        }
        if (!Number.isFinite(Number(r.price)) || Number(r.price) < 0) {
          throw new Error(`Row ${i + 1}: enter a valid price`);
        }
      }

      for (const r of rows) {
        const res = await fetch("/api/inventory/parts-purchases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplierId,
            date,
            salesCategoryId: r.salesCategoryId,
            mobileName: String(r.mobileName || "").trim() || "—",
            productName: String(r.productName || "").trim(),
            quality: r.quality,
            quantity: Number(r.quantity || 0),
            purchasePrice: Number(r.price || 0),
            gstAmount: 0,
            notes: "",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save a line");
      }

      setRows([newRow(qualityDefault)]);
      setNotice("Purchase saved and stock increased.");
      await loadMaster();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeHistoryEntry(row) {
    if (!row?._id) return;
    const ok = window.confirm("Delete this purchase entry? This will also update stock.");
    if (!ok) return;
    setDeletingId(row._id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/inventory/parts-purchases/${row._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete purchase");
      setNotice("Purchase entry removed.");
      await loadMaster();
    } catch (e2) {
      setError(e2.message || "Failed to delete purchase");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-black">Purchase Entry</h1>
      <p className="mt-1 text-sm text-black/60">
        Buy from supplier, auto-calculate total, and increase stock. Uses <strong>sales categories</strong> (ledger),
        not shop categories — type the product name (no product dropdown).
      </p>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p> : null}

      <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase text-black/45">Supplier</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              <option value="" disabled>
                Select supplier
              </option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-black/45">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-black/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase text-black/45">
              <tr>
                <th className="px-3 py-2">Sales category</th>
                <th className="px-3 py-2">Mobile (optional)</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Quality</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Row total</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">
                    <select
                      value={row.salesCategoryId}
                      onChange={(e) => updateRow(i, { salesCategoryId: e.target.value })}
                      className="min-w-[8rem] rounded-lg border border-black/15 px-2 py-2 text-sm outline-none focus:border-brand"
                    >
                      <option value="" disabled>
                        Sales category
                      </option>
                      {salesCategories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.mobileName}
                      onChange={(e) => updateRow(i, { mobileName: e.target.value })}
                      placeholder="e.g. iPhone 12"
                      className="w-36 min-w-[7rem] rounded-lg border border-black/15 px-2 py-2 text-sm outline-none focus:border-brand"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.productName}
                      onChange={(e) => updateRow(i, { productName: e.target.value })}
                      placeholder="Type product name"
                      className="min-w-[10rem] rounded-lg border border-black/15 px-2 py-2 text-sm outline-none focus:border-brand"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.quality}
                      onChange={(e) => updateRow(i, { quality: e.target.value })}
                      className="min-w-[7rem] rounded-lg border border-black/15 px-2 py-2 text-sm outline-none focus:border-brand"
                    >
                      <option value="" disabled>
                        Quality
                      </option>
                      {qualities.map((q) => (
                        <option key={q._id} value={q.name}>
                          {q.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={row.quantity}
                      onChange={(e) => updateRow(i, { quantity: Number(e.target.value || 0) })}
                      className="w-20 rounded-lg border border-black/15 px-2 py-2 text-sm outline-none focus:border-brand"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={row.price}
                      onChange={(e) => updateRow(i, { price: Number(e.target.value || 0) })}
                      className="w-28 rounded-lg border border-black/15 px-2 py-2 text-sm outline-none focus:border-brand"
                    />
                  </td>
                  <td className="px-3 py-2 font-semibold">
                    ₹{(Number(row.quantity || 0) * Number(row.price || 0)).toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={addRow}
            className="min-h-11 rounded-full border border-black/15 px-4 py-2 text-sm font-semibold"
          >
            + Add row
          </button>
          <p className="text-sm font-bold text-black">Grand total: ₹{grandTotal.toLocaleString("en-IN")}</p>
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-black shadow-sm disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save purchase"}
          </button>
        </div>
      </form>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-black">Purchase history</h2>
        <DownloadExports
          filenameBase="purchases"
          title="Purchase history"
          subtitle="Admin exports"
          metaLines={[`Rows: ${exportRows.length}`]}
          columns={exportColumns}
          rows={exportRows}
        />
      </div>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Sales category</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {history.map((h) => (
              <tr key={h._id}>
                <td className="px-4 py-3 whitespace-nowrap">{new Date(h.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium text-black">{h.supplierName || "—"}</td>
                <td className="px-4 py-3">{h.salesCategoryName || "—"}</td>
                <td className="px-4 py-3">
                  {h.productName}
                  {h.mobileName && h.mobileName !== "—" ? (
                    <span className="text-black/45"> · {h.mobileName}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3">{h.quantity}</td>
                <td className="px-4 py-3 font-bold">₹{Number(h.lineTotal || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => removeHistoryEntry(h)}
                    disabled={deletingId === h._id}
                    className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                  >
                    {deletingId === h._id ? "Removing…" : "Remove"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 ? <p className="p-8 text-center text-sm text-black/55">No purchases yet.</p> : null}
      </div>
    </div>
  );
}
