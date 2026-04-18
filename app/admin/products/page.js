"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AdminProductsPage() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = categorySlug
        ? `/api/products?category=${encodeURIComponent(categorySlug)}`
        : "/api/products";
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setProducts(data.products || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [categorySlug]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id) {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json();
      alert(j.error || "Delete failed");
      return;
    }
    load();
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-black">Products</h1>
          <p className="mt-1 text-sm text-black/60">
            {categorySlug ? (
              <>
                Filtered by category slug:{" "}
                <span className="font-mono font-semibold text-black">{categorySlug}</span> ·{" "}
                <Link href="/admin/products" className="text-brand-dim hover:underline">
                  Clear
                </Link>
              </>
            ) : (
              "Add, edit, or remove catalogue items."
            )}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-black shadow-md hover:bg-brand-dim"
        >
          + Add product
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {loading ? (
        <p className="mt-10 text-sm text-black/55">Loading…</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Brand / Model</th>
                <th className="px-4 py-3">Quality</th>
                <th className="px-4 py-3">Buy / Sell</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-zinc-50/80">
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-zinc-100">
                      {p.images?.[0] ? (
                        <Image src={p.images[0]} alt="" fill className="object-cover" sizes="48px" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-[10px] text-black/35">—</span>
                      )}
                    </div>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 font-medium text-black">{p.name}</td>
                  <td className="px-4 py-3 text-black/70">{p.categoryId?.name || "—"}</td>
                  <td className="px-4 py-3 text-black/70">
                    {p.brand}
                    <br />
                    <span className="text-xs">{p.model}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold">{p.quality}</td>
                  <td className="px-4 py-3 text-black/75">
                    ₹{Number(p.purchasePrice || 0).toLocaleString("en-IN")} /{" "}
                    <span className="font-bold text-black">
                      ₹{Number(p.sellingPrice ?? p.price ?? 0).toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-bold ${Number(p.stock || 0) <= 5 ? "text-red-600" : "text-black"}`}>
                    {Number(p.stock || 0)}
                  </td>
                  <td className="px-4 py-3">{p.featured ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${p._id}/edit`}
                      className="font-semibold text-brand-dim hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(p._id)}
                      className="ml-3 font-semibold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <p className="p-8 text-center text-sm text-black/55">No products yet.</p>}
        </div>
      )}
    </div>
  );
}
