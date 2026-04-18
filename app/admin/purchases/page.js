"use client";

import { useEffect, useMemo, useState } from "react";

function newRow() {
  return { productId: "", quantity: 1, price: 0 };
}

export default function AdminPurchasesPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([newRow()]);
  const [supplierId, setSupplierId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState([]);

  async function loadMaster() {
    const [sRes, pRes, hRes] = await Promise.all([
      fetch("/api/suppliers"),
      fetch("/api/products"),
      fetch("/api/purchases"),
    ]);
    const sJson = await sRes.json();
    const pJson = await pRes.json();
    const hJson = await hRes.json();
    if (!sRes.ok) throw new Error(sJson.error || "Failed suppliers");
    if (!pRes.ok) throw new Error(pJson.error || "Failed products");
    if (!hRes.ok) throw new Error(hJson.error || "Failed purchases");
    setSuppliers(sJson.suppliers || []);
    setProducts(pJson.products || []);
    setHistory(hJson.purchases || []);
  }

  useEffect(() => {
    loadMaster().catch((e) => setError(e.message));
  }, []);

  const grandTotal = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.quantity || 0) * Number(r.price || 0), 0),
    [rows]
  );

  function updateRow(i, key, value) {
    setRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== i) return r;
        const next = { ...r, [key]: value };
        if (key === "productId") {
          const p = products.find((x) => x._id === value);
          if (p && Number(next.price || 0) <= 0) {
            next.price = Number(p.purchasePrice || p.sellingPrice || p.price || 0);
          }
        }
        return next;
      })
    );
  }

  function addRow() {
    setRows((r) => [...r, newRow()]);
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
      const payload = {
        supplierId,
        date,
        products: rows.map((r) => ({
          productId: r.productId,
          quantity: Number(r.quantity || 0),
          price: Number(r.price || 0),
        })),
      };
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save purchase");
      setRows([newRow()]);
      setSupplierId("");
      setNotice("Purchase saved and stock increased.");
      await loadMaster();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-black">Purchase Entry</h1>
      <p className="mt-1 text-sm text-black/60">Buy from supplier, auto-calculate total, and increase stock.</p>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p> : null}

      <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase text-black/45">Supplier</label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
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
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-black/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase text-black/45">
              <tr>
                <th className="px-3 py-2">Product</th>
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
                      required
                      value={row.productId}
                      onChange={(e) => updateRow(i, "productId", e.target.value)}
                      className="w-full rounded-lg border border-black/15 px-2 py-2 text-sm outline-none focus:border-brand"
                    >
                      <option value="" disabled>
                        Select product
                      </option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.brand} {p.model})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => updateRow(i, "quantity", Number(e.target.value || 0))}
                      className="w-24 rounded-lg border border-black/15 px-2 py-2 text-sm outline-none focus:border-brand"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      value={row.price}
                      onChange={(e) => updateRow(i, "price", Number(e.target.value || 0))}
                      className="w-32 rounded-lg border border-black/15 px-2 py-2 text-sm outline-none focus:border-brand"
                    />
                  </td>
                  <td className="px-3 py-2 font-semibold">₹{(Number(row.quantity || 0) * Number(row.price || 0)).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => removeRow(i)} className="text-xs font-bold text-red-600 hover:underline">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={addRow} className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold">
            + Add row
          </button>
          <p className="text-sm font-bold text-black">
            Grand total: ₹{grandTotal.toLocaleString("en-IN")}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-black shadow-sm disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save purchase"}
          </button>
        </div>
      </form>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {history.map((h) => (
              <tr key={h._id}>
                <td className="px-4 py-3">{new Date(h.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium text-black">{h.supplierId?.name || "—"}</td>
                <td className="px-4 py-3">{(h.products || []).length}</td>
                <td className="px-4 py-3 font-bold">₹{Number(h.totalAmount || 0).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 ? <p className="p-8 text-center text-sm text-black/55">No purchases yet.</p> : null}
      </div>
    </div>
  );
}
