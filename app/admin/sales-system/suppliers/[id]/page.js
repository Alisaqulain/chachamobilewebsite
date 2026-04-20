"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import DownloadExports from "@/components/admin/DownloadExports";

const emptyPurchase = {
  date: new Date().toISOString().slice(0, 10),
  salesCategoryId: "",
  folderName: "",
  modelNames: "",
  quality: "",
  quantity: "1",
  purchasePrice: "",
  gstAmount: "0",
  notes: "",
};

function pickDefaultSalesCategoryId(categories) {
  if (!categories?.length) return "";
  const folder = categories.find((c) => String(c.slug || "").toLowerCase() === "folder");
  return folder?._id || categories[0]._id || "";
}

export default function SupplierPurchasesPage() {
  const params = useParams();
  const id = params?.id ? String(params.id) : "";
  const [supplier, setSupplier] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState(emptyPurchase);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [returnFor, setReturnFor] = useState(null);
  const [returnQty, setReturnQty] = useState("1");
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [sRes, pRes, cRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch(`/api/inventory/parts-purchases?supplierId=${encodeURIComponent(id)}`),
        fetch("/api/sales-categories"),
      ]);
      const sJson = await sRes.json();
      const pJson = await pRes.json();
      const cJson = await cRes.json();
      if (!sRes.ok) throw new Error(sJson.error || "Failed suppliers");
      if (!pRes.ok) throw new Error(pJson.error || "Failed purchases");
      const sup = (sJson.suppliers || []).find((x) => x._id === id);
      setSupplier(sup || { name: "Supplier", _id: id });
      setPurchases(pJson.purchases || []);
      const cats = cRes.ok ? cJson.categories || [] : [];
      setCategories(cats);
      setForm((f) => ({
        ...f,
        salesCategoryId: f.salesCategoryId || pickDefaultSalesCategoryId(cats),
      }));
    } catch (e) {
      setToast(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const exportColumns = useMemo(
    () => [
      { header: "Date", key: "date", width: 12 },
      { header: "Folder", key: "folder", width: 16 },
      { header: "Model", key: "model", width: 26 },
      { header: "Sales category", key: "salesCategory", width: 18 },
      { header: "Quality", key: "quality", width: 12 },
      { header: "Qty", key: "qty", width: 8 },
      { header: "Price", key: "price", width: 12 },
      { header: "Total", key: "total", width: 12 },
    ],
    []
  );

  const exportRows = useMemo(
    () =>
      (purchases || []).map((row) => ({
        date: row.date ? new Date(row.date).toLocaleDateString() : "—",
        folder: row.mobileName || "—",
        model: row.productName || "—",
        salesCategory: row.salesCategoryName || "—",
        quality: row.quality || "—",
        qty: String(row.quantity ?? ""),
        price: `₹${Number(row.purchasePrice || 0).toLocaleString("en-IN")}`,
        total: `₹${Number(row.lineTotal || 0).toLocaleString("en-IN")}`,
      })),
    [purchases]
  );

  const supplierPurchaseTotal = useMemo(
    () => (purchases || []).reduce((sum, row) => sum + Number(row.lineTotal || 0), 0),
    [purchases]
  );

  const supplierPurchaseUnits = useMemo(
    () => (purchases || []).reduce((sum, row) => sum + Number(row.quantity || 0), 0),
    [purchases]
  );

  async function onAddPurchase(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/inventory/parts-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: id,
          date: form.date,
          salesCategoryId: form.salesCategoryId,
          mobileName: form.folderName,
          productName: form.modelNames,
          quality: form.quality,
          quantity: Number(form.quantity),
          purchasePrice: Number(form.purchasePrice),
          gstAmount: Number(form.gstAmount || 0),
          notes: form.notes,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      setForm({
        ...emptyPurchase,
        date: new Date().toISOString().slice(0, 10),
        salesCategoryId: pickDefaultSalesCategoryId(categories),
      });
      setToast("Purchase saved · stock updated");
      await load();
    } catch (e) {
      setToast(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function onSaveEdit(e) {
    e.preventDefault();
    if (!editId || !editForm) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/inventory/parts-purchases/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(editForm.quantity),
          purchasePrice: Number(editForm.purchasePrice),
          gstAmount: Number(editForm.gstAmount || 0),
          notes: editForm.notes,
          date: editForm.date,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Update failed");
      setEditId(null);
      setEditForm(null);
      setToast("Updated");
      await load();
    } catch (e) {
      setToast(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function delPurchase(row) {
    if (!confirm("Delete this purchase line?")) return;
    const res = await fetch(`/api/inventory/parts-purchases/${row._id}`, { method: "DELETE" });
    const j = await res.json();
    if (!res.ok) {
      setToast(j.error || "Delete failed");
      return;
    }
    setToast("Purchase deleted");
    await load();
  }

  async function submitReturn(e) {
    e.preventDefault();
    if (!returnFor) return;
    setSaving(true);
    try {
      const res = await fetch("/api/inventory/parts-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partsPurchaseId: returnFor._id,
          quantity: Number(returnQty),
          date: returnDate,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Return failed");
      setReturnFor(null);
      setToast("Return recorded");
      await load();
    } catch (e) {
      setToast(e.message);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(row) {
    setEditId(row._id);
    setEditForm({
      quantity: String(row.quantity),
      purchasePrice: String(row.purchasePrice),
      gstAmount: String(row.gstAmount ?? 0),
      notes: row.notes || "",
      date: row.date ? String(row.date).slice(0, 10) : "",
    });
  }

  if (!id) return null;

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/sales-system/suppliers" className="text-sm font-semibold text-brand-dim hover:underline">
            ← All suppliers
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-black">{supplier?.name || "Supplier"}</h1>
          <p className="text-sm text-black/55">Purchase entry increases stock. Returns reduce stock.</p>
        </div>
      </div>

      {toast ? (
        <p className="mt-4 rounded-lg border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-black">{toast}</p>
      ) : null}

      <h2 className="mt-8 text-lg font-bold text-black">Add purchase</h2>
      <p className="mt-1 text-xs text-black/50">
        Choose a <strong>sales category</strong> (ledger only — not the website shop). <strong>Folder name</strong> on the line is the brand or family (e.g.
        Oppo). <strong>Model / product</strong> is one label for this line (you can type e.g. &quot;A23, Reno 12&quot; as
        text — it stays one row and <strong>quantity</strong> is the total pcs for this line only).{" "}
        <strong>Quality</strong> is free text.
      </p>
      <form
        onSubmit={onAddPurchase}
        className="mt-3 grid gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3"
      >
        <div>
          <label className="text-xs font-bold text-black/45">Date</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">Sales category</label>
          <select
            required
            value={form.salesCategoryId}
            onChange={(e) => setForm((f) => ({ ...f, salesCategoryId: e.target.value }))}
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          >
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">Quality</label>
          <input
            required
            value={form.quality}
            onChange={(e) => setForm((f) => ({ ...f, quality: e.target.value }))}
            placeholder="e.g. Original, Local…"
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">Folder (brand / family)</label>
          <input
            required
            value={form.folderName}
            onChange={(e) => setForm((f) => ({ ...f, folderName: e.target.value }))}
            placeholder="e.g. Oppo"
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-black/45">Model / product label</label>
          <input
            required
            value={form.modelNames}
            onChange={(e) => setForm((f) => ({ ...f, modelNames: e.target.value }))}
            placeholder="e.g. A23, Reno 12 (one line = one qty)"
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">Quantity</label>
          <input
            required
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">Purchase price (unit)</label>
          <input
            required
            type="number"
            min={0}
            step={1}
            value={form.purchasePrice}
            onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">GST amount (optional)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={form.gstAmount}
            onChange={(e) => setForm((f) => ({ ...f, gstAmount: e.target.value }))}
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="text-xs font-bold text-black/45">Notes</label>
          <input
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            disabled={saving}
            className="min-h-12 w-full rounded-lg bg-black px-6 text-sm font-bold text-brand disabled:opacity-50 sm:w-auto"
          >
            {saving ? "Saving…" : "Save purchase"}
          </button>
        </div>
      </form>

      <h2 className="mt-10 text-lg font-bold text-black">Purchases</h2>
      {loading ? (
        <p className="mt-4 text-sm text-black/55">Loading…</p>
      ) : (
        <div className="mt-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <div>
              <p className="text-sm font-semibold text-black/70">Export these purchase lines</p>
              <p className="text-xs font-semibold text-black/60">
                Supplier total: ₹{supplierPurchaseTotal.toLocaleString("en-IN")} · Units:{" "}
                {supplierPurchaseUnits.toLocaleString("en-IN")}
              </p>
            </div>
            <DownloadExports
              filenameBase={`supplier_purchases_${supplier?.name || id}`}
              title="Supplier purchases"
              subtitle={supplier?.name || "Supplier"}
              metaLines={[`Rows: ${exportRows.length}`]}
              columns={exportColumns}
              rows={exportRows}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Folder</th>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Sales category</th>
                <th className="px-3 py-2">Quality</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {purchases.map((row) => (
                <tr key={row._id}>
                  <td className="px-3 py-2 whitespace-nowrap">{row.date ? new Date(row.date).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-2">{row.mobileName}</td>
                  <td className="px-3 py-2 font-medium">{row.productName}</td>
                  <td className="px-3 py-2">{row.salesCategoryName || "—"}</td>
                  <td className="px-3 py-2">{row.quality}</td>
                  <td className="px-3 py-2">{row.quantity}</td>
                  <td className="px-3 py-2">₹{Number(row.purchasePrice).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2 font-semibold">₹{Number(row.lineTotal).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => openEdit(row)} className="mr-2 text-xs font-bold text-brand-dim">
                      Edit
                    </button>
                    <button type="button" onClick={() => setReturnFor(row)} className="mr-2 text-xs font-bold text-black">
                      Return
                    </button>
                    <button type="button" onClick={() => delPurchase(row)} className="text-xs font-bold text-red-600">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchases.length === 0 ? <p className="p-6 text-center text-sm text-black/50">No purchases yet.</p> : null}
          </div>
        </div>
      )}

      {editId && editForm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form
            onSubmit={onSaveEdit}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
          >
            <h3 className="text-lg font-bold">Edit purchase</h3>
            <p className="text-xs text-black/50">Quantity, price, GST, notes, and date only.</p>
            <div className="mt-4 grid gap-3">
              <input
                type="date"
                required
                value={editForm.date}
                onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                className="min-h-12 rounded-lg border px-3 text-sm"
              />
              <input
                type="number"
                min={1}
                value={editForm.quantity}
                onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
                className="min-h-12 rounded-lg border px-3 text-sm"
              />
              <input
                type="number"
                min={0}
                value={editForm.purchasePrice}
                onChange={(e) => setEditForm((f) => ({ ...f, purchasePrice: e.target.value }))}
                className="min-h-12 rounded-lg border px-3 text-sm"
              />
              <input
                type="number"
                min={0}
                value={editForm.gstAmount}
                onChange={(e) => setEditForm((f) => ({ ...f, gstAmount: e.target.value }))}
                className="min-h-12 rounded-lg border px-3 text-sm"
              />
              <input
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                className="min-h-12 rounded-lg border px-3 text-sm"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="min-h-11 flex-1 rounded-lg bg-black text-sm font-bold text-brand">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setEditForm(null);
                }}
                className="min-h-11 flex-1 rounded-lg border text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {returnFor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form onSubmit={submitReturn} className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold">Return to supplier</h3>
            <p className="text-xs text-black/55">
              {returnFor.productName} · max returnable based on purchase qty minus past returns.
            </p>
            <div className="mt-4 grid gap-3">
              <input
                type="number"
                min={1}
                required
                value={returnQty}
                onChange={(e) => setReturnQty(e.target.value)}
                className="min-h-12 rounded-lg border px-3"
              />
              <input
                type="date"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="min-h-12 rounded-lg border px-3"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="min-h-11 flex-1 rounded-lg bg-black text-sm font-bold text-brand">
                Submit return
              </button>
              <button type="button" onClick={() => setReturnFor(null)} className="min-h-11 flex-1 rounded-lg border text-sm font-semibold">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
