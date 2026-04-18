"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/summary");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        setData(json);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-black">Dashboard</h1>
      <p className="mt-1 text-sm text-black/60">Simple overview for stock, billing entries, and parties.</p>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {data && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-black/45">Products</p>
              <p className="mt-2 text-4xl font-black text-black">{data.productCount || 0}</p>
              <Link
                href="/admin/products"
                className="mt-4 inline-block text-sm font-semibold text-brand-dim hover:underline"
              >
                Manage products →
              </Link>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-black/45">Inventory alert</p>
              <p className={`mt-2 text-4xl font-black ${Number(data.lowStockCount || 0) > 0 ? "text-red-600" : "text-black"}`}>
                {data.lowStockCount || 0}
              </p>
              <Link
                href="/admin/inventory"
                className="mt-4 inline-block text-sm font-semibold text-brand-dim hover:underline"
              >
                Check inventory →
              </Link>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-black/45">Parties</p>
              <p className="mt-2 text-2xl font-black text-black">
                {data.supplierCount || 0} Suppliers
              </p>
              <p className="mt-1 text-2xl font-black text-black">{data.customerCount || 0} Customers</p>
              <Link
                href="/admin/suppliers"
                className="mt-4 inline-block text-sm font-semibold text-brand-dim hover:underline"
              >
                Open parties →
              </Link>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-black/45">Entries</p>
              <p className="mt-2 text-sm font-semibold text-black/80">
                Purchase: <span className="text-black">{data.purchaseCount || 0}</span>
              </p>
              <p className="mt-1 text-sm font-semibold text-black/80">
                Sales: <span className="text-black">{data.saleCount || 0}</span>
              </p>
              <p className="mt-1 text-sm font-semibold text-black/80">
                Returns: <span className="text-black">{data.returnCount || 0}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link href="/admin/purchases" className="font-semibold text-brand-dim hover:underline">
                  Purchases
                </Link>
                <Link href="/admin/sales" className="font-semibold text-brand-dim hover:underline">
                  Sales
                </Link>
                <Link href="/admin/returns" className="font-semibold text-brand-dim hover:underline">
                  Returns
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-black">Recent products</h2>
              <Link href="/admin/products" className="text-sm font-semibold text-brand-dim hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
                  <tr>
                    <th className="px-4 py-3">Image</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {(data.recentProducts || []).map((p) => (
                    <tr key={p._id} className="hover:bg-zinc-50/80">
                      <td className="px-4 py-3">
                        <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-zinc-100">
                          {p.images?.[0] ? (
                            <Image src={p.images[0]} alt="" fill className="object-cover" sizes="44px" />
                          ) : (
                            <span className="flex h-full items-center justify-center text-[10px] text-black/35">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="max-w-[200px] px-4 py-3 font-medium text-black">
                        <Link href={`/admin/products/${p._id}/edit`} className="hover:text-brand-dim hover:underline">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-black/65">{p.categoryId?.name || "—"}</td>
                      <td className="px-4 py-3 font-bold">₹{Number(p.price).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!data.recentProducts || data.recentProducts.length === 0) && (
                <p className="p-8 text-center text-sm text-black/55">No products yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
