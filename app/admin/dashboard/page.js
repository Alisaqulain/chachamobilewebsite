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
      <p className="mt-1 text-sm text-black/60">Overview of your catalogue and latest additions.</p>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {data && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-black/45">Total products</p>
              <p className="mt-2 text-4xl font-black text-black">{data.productCount}</p>
              <Link
                href="/admin/products"
                className="mt-4 inline-block text-sm font-semibold text-brand-dim hover:underline"
              >
                Manage products →
              </Link>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-black/45">Total categories</p>
              <p className="mt-2 text-4xl font-black text-black">{data.categoryCount}</p>
              <Link
                href="/admin/categories"
                className="mt-4 inline-block text-sm font-semibold text-brand-dim hover:underline"
              >
                Manage categories →
              </Link>
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
