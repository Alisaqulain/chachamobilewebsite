"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const emptyPurchase = {
  date: new Date().toISOString().slice(0, 10),
  categoryId: "",
  mobileName: "",
  productName: "",
  quality: "",
  quantity: "1",
  purchasePrice: "",
  gstAmount: "0",
  notes: "",
};

export default function SupplierPurchasesPage() {
  const params = useParams();
  const id = params?.id ? String(params.id) : "";
  const [supplier, setSupplier] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [qualities, setQualities] = useState([]);
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
      const [sRes, pRes, cRes, qRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch(`/api/inventory/parts-purchases?supplierId=${encodeURIComponent(id)}`),
        fetch("/api/categories"),
        fetch("/api/product-qualities"),
      ]);
      const sJson = await sRes.json();
      const pJson = await pRes.json();
      const cJson = await cRes.json();
      const qJson = await qRes.json();
      if (!sRes.ok) throw new Error(sJson.error || "Failed suppliers");
      if (!pRes.ok) throw new Error(pJson.error || "Failed purchases");
      const sup = (sJson.suppliers || []).find((x) => x._id === id);
      setSupplier(sup || { name: "Supplier", _id: id });
      setPurchases(pJson.purchases || []);
      if (cRes.ok) setCategories(cJson.categories || []);
      if (qRes.ok) setQualities(qJson.qualities || []);
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
          categoryId: form.categoryId,
          mobileName: form.mobileName,
          productName: form.productName,
          quality: form.quality,
          quantity: Number(form.quantity),
          purchasePrice: Number(form.purchasePrice),
          gstAmount: Number(form.gstAmount || 0),
          notes: form.notes,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      setForm({ ...emptyPurchase, date: new Date().toISOString().slice(0, 10) });
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
          <label className="text-xs font-bold text-black/45">Category</label>
          <select
            required
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
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
          <select
            required
            value={form.quality}
            onChange={(e) => setForm((f) => ({ ...f, quality: e.target.value }))}
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          >
            <option value="">Select…</option>
            {qualities.map((q) => (
              <option key={q._id} value={q.name}>
                {q.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">Mobile name</label>
          <input
            required
            value={form.mobileName}
            onChange={(e) => setForm((f) => ({ ...f, mobileName: e.target.value }))}
            placeholder="e.g. iPhone 12"
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">Product name</label>
          <input
            required
            value={form.productName}
            onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
            placeholder="e.g. Back panel 303"
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
        <div className="mt-3 overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Mobile</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Category</th>
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
                  <td className="px-3 py-2">{row.categoryName}</td>
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
