"use client";

import { useEffect, useMemo, useState } from "react";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setProducts(data.products || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.name} ${p.brand} ${p.model} ${p.category}`.toLowerCase().includes(q));
  }, [products, search]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-black">Inventory</h1>
          <p className="mt-1 text-sm text-black/60">Live stock table with low-stock highlight.</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product / brand / model"
          className="w-full max-w-sm rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <p className="mt-8 text-sm text-black/60">Loading…</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Purchase price</th>
                <th className="px-4 py-3">Selling price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.map((p) => {
                const stock = Number(p.stock || 0);
                return (
                  <tr key={p._id} className={stock <= 5 ? "bg-red-50/60" : ""}>
                    <td className="px-4 py-3 font-semibold text-black">
                      {p.name}
                      <p className="text-xs font-normal text-black/55">
                        {p.brand} · {p.model}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-black/70">{p.category || "—"}</td>
                    <td className={`px-4 py-3 font-bold ${stock <= 5 ? "text-red-600" : "text-black"}`}>{stock}</td>
                    <td className="px-4 py-3">₹{Number(p.purchasePrice || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-semibold">₹{Number(p.sellingPrice ?? p.price ?? 0).toLocaleString("en-IN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 ? <p className="p-8 text-center text-sm text-black/55">No products found.</p> : null}
        </div>
      )}
    </div>
  );
}
