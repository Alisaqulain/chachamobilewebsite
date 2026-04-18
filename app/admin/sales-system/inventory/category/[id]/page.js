"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function InventoryCategoryDetailPage() {
  const params = useParams();
  const id = params?.id ? String(params.id) : "";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/inventory/category/${id}`);
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Failed");
        setData(j);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [id]);

  return (
    <div className="max-w-6xl">
      <Link href="/admin/sales-system/inventory" className="text-sm font-semibold text-brand-dim hover:underline">
        ← Categories
      </Link>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {data ? (
        <>
          <h1 className="mt-4 text-2xl font-bold text-black">{data.category?.name}</h1>
          <div className="mt-6 overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
                <tr>
                  <th className="px-3 py-2">Mobile</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Quality</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Returned</th>
                  <th className="px-3 py-2">Sold</th>
                  <th className="px-3 py-2">Last purchase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {(data.items || []).map((row) => (
                  <tr key={row.stockGroupId}>
                    <td className="px-3 py-2">{row.mobileName}</td>
                    <td className="px-3 py-2 font-medium">{row.productName}</td>
                    <td className="px-3 py-2">{row.quality}</td>
                    <td className="px-3 py-2 font-bold">{row.totalStock}</td>
                    <td className="px-3 py-2">{row.totalReturned}</td>
                    <td className="px-3 py-2">{row.totalSold}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {row.lastPurchaseDate ? new Date(row.lastPurchaseDate).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(data.items || []).length === 0 ? (
              <p className="p-8 text-center text-sm text-black/50">No stock lines in this category yet.</p>
            ) : null}
          </div>
        </>
      ) : !error ? (
        <p className="mt-8 text-sm text-black/55">Loading…</p>
      ) : null}
    </div>
  );
}
