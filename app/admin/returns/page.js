"use client";

import { useEffect, useMemo, useState } from "react";
import DownloadExports from "@/components/admin/DownloadExports";

function newRow() {
  return { productId: "", qty: 1 };
}

export default function AdminReturnsPage() {
  const [type, setType] = useState("purchase_return");
  const [saleCustomerType, setSaleCustomerType] = useState("walk_in");
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [partyId, setPartyId] = useState("");
  const [saleWalkInName, setSaleWalkInName] = useState("");
  const [saleWalkInPhone, setSaleWalkInPhone] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([newRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState([]);

  async function loadMaster() {
    const [sRes, cRes, pRes, rRes] = await Promise.all([
      fetch("/api/suppliers"),
      fetch("/api/customers"),
      fetch("/api/products"),
      fetch("/api/returns"),
    ]);
    const sJson = await sRes.json();
    const cJson = await cRes.json();
    const pJson = await pRes.json();
    const rJson = await rRes.json();
    if (!sRes.ok) throw new Error(sJson.error || "Failed suppliers");
    if (!cRes.ok) throw new Error(cJson.error || "Failed customers");
    if (!pRes.ok) throw new Error(pJson.error || "Failed products");
    if (!rRes.ok) throw new Error(rJson.error || "Failed returns");
    setSuppliers(sJson.suppliers || []);
    setCustomers(cJson.customers || []);
    setProducts(pJson.products || []);
    setHistory(rJson.returns || []);
  }

  useEffect(() => {
    loadMaster().catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setPartyId("");
    setSaleWalkInName("");
    setSaleWalkInPhone("");
  }, [type]);

  useEffect(() => {
    if (type === "sale_return" && saleCustomerType === "walk_in") {
      setPartyId("");
    }
  }, [type, saleCustomerType]);

  const totalQty = useMemo(() => rows.reduce((s, r) => s + Number(r.qty || 0), 0), [rows]);

  const exportColumns = useMemo(
    () => [
      { header: "Date", key: "date", width: 12 },
      { header: "Type", key: "type", width: 14 },
      { header: "Party", key: "party", width: 18 },
      { header: "Items", key: "items", width: 8 },
    ],
    []
  );

  const exportRows = useMemo(
    () =>
      (history || []).map((h) => ({
        date: h.date ? new Date(h.date).toLocaleDateString() : "—",
        type: h.type === "purchase_return" ? "Purchase Return" : "Sales Return",
        party: h.partyLabel || "—",
        items: String((h.products || []).length),
      })),
    [history]
  );

  function updateRow(i, key, value) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
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
      if (type === "sale_return" && saleCustomerType === "saved" && !partyId) {
        throw new Error("Select a saved customer, or use Walk-in.");
      }
      const payload = {
        type,
        partyId: type === "purchase_return" ? partyId : saleCustomerType === "saved" ? partyId : "",
        saleWalkInName: type === "sale_return" && saleCustomerType === "walk_in" ? saleWalkInName : "",
        saleWalkInPhone: type === "sale_return" && saleCustomerType === "walk_in" ? saleWalkInPhone : "",
        date,
        products: rows.map((r) => ({
          productId: r.productId,
          qty: Number(r.qty || 0),
        })),
      };
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save return");
      setRows([newRow()]);
      setNotice("Return saved. Stock updated.");
      await loadMaster();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-black">Returns</h1>
      <p className="mt-1 text-sm text-black/60">
        Purchase return decreases stock. Sales return increases stock. Sales return supports walk-in
        or saved customer.
      </p>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p> : null}

      <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-xs font-bold uppercase text-black/45">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              <option value="purchase_return">Purchase Return</option>
              <option value="sale_return">Sales Return</option>
            </select>
          </div>

          {type === "purchase_return" ? (
            <div>
              <label className="text-xs font-bold uppercase text-black/45">Supplier</label>
              <select
                required
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
              >
                <option value="" disabled>
                  Select supplier
                </option>
                {suppliers.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="lg:col-span-2 space-y-3">
              <p className="text-xs font-bold uppercase text-black/45">Customer (sales return)</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <input
                    type="radio"
                    name="saleCust"
                    checked={saleCustomerType === "walk_in"}
                    onChange={() => setSaleCustomerType("walk_in")}
                    className="h-4 w-4 accent-brand"
                  />
                  Walk-in
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <input
                    type="radio"
                    name="saleCust"
                    checked={saleCustomerType === "saved"}
                    onChange={() => setSaleCustomerType("saved")}
                    className="h-4 w-4 accent-brand"
                  />
                  Saved customer
                </label>
              </div>
              {saleCustomerType === "saved" ? (
                <select
                  required
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  className="w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="" disabled>
                    Select customer
                  </option>
                  {customers.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={saleWalkInName}
                    onChange={(e) => setSaleWalkInName(e.target.value)}
                    placeholder="Name (optional)"
                    className="min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
                  />
                  <input
                    type="tel"
                    value={saleWalkInPhone}
                    onChange={(e) => setSaleWalkInPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    className="min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </div>
              )}
            </div>
          )}

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
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Qty</th>
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
                      className="w-full min-h-11 rounded-lg border border-black/15 px-2 py-2 text-sm outline-none focus:border-brand"
                    >
                      <option value="" disabled>
                        Select product
                      </option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.brand} {p.model}) — {p.quality} — stock {p.stock}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      value={row.qty}
                      onChange={(e) => updateRow(i, "qty", Number(e.target.value || 0))}
                      className="w-24 min-h-11 rounded-lg border border-black/15 px-2 py-2 text-sm outline-none focus:border-brand"
                    />
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
          <p className="text-sm font-bold text-black">Total qty: {totalQty}</p>
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-black shadow-sm disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save return"}
          </button>
        </div>
      </form>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-black">Returns history</h2>
        <DownloadExports
          filenameBase="returns"
          title="Returns history"
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
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Party</th>
              <th className="px-4 py-3">Items</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {history.map((h) => (
              <tr key={h._id}>
                <td className="px-4 py-3 whitespace-nowrap">{new Date(h.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-semibold">
                  {h.type === "purchase_return" ? "Purchase Return" : "Sales Return"}
                </td>
                <td className="px-4 py-3 text-black/80">{h.partyLabel || "—"}</td>
                <td className="px-4 py-3">{(h.products || []).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 ? <p className="p-8 text-center text-sm text-black/55">No returns yet.</p> : null}
      </div>
    </div>
  );
}
