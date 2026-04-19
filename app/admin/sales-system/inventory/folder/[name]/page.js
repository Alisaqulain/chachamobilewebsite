"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function InventoryFolderDetailPage() {
  const params = useParams();
  const name = params?.name ? String(params.name) : "";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const load = useCallback(async () => {
    if (!name) return;
    const res = await fetch(`/api/inventory/folder/${encodeURIComponent(name)}`);
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Failed");
    setData(j);
  }, [name]);

  useEffect(() => {
    if (!name) return;
    (async () => {
      try {
        await load();
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [load, name]);

  async function deleteStockLine(row) {
    if (!row.canDelete) {
      window.alert("This line has sold quantity. It cannot be deleted from here.");
      return;
    }
    const label = `${row.productName} (${row.quality})`;
    if (!window.confirm(`Delete this stock line permanently?\n\n${label}\n\nThis removes all purchase and return history for this line.`)) {
      return;
    }
    setDeletingId(row.stockGroupId);
    try {
      const res = await fetch(`/api/inventory/stock-group/${row.stockGroupId}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Delete failed");
      await load();
    } catch (e) {
      window.alert(e.message || "Delete failed");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="max-w-6xl">
      <Link href="/admin/sales-system/inventory" className="text-sm font-semibold text-brand-dim hover:underline">
        ← All folders
      </Link>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {data ? (
        <>
          <h1 className="mt-4 text-2xl font-bold text-black">{data.folder?.name}</h1>
          <p className="mt-1 text-xs text-black/50">Models and qualities in this folder. Use Delete to remove a wrong line.</p>
          <div className="mt-6 overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
                <tr>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2">Quality</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Returned</th>
                  <th className="px-3 py-2">Sold</th>
                  <th className="px-3 py-2">Last purchase</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {(data.items || []).map((row) => (
                  <tr key={row.stockGroupId}>
                    <td className="px-3 py-2 font-medium">{row.productName}</td>
                    <td className="px-3 py-2">{row.quality}</td>
                    <td className="px-3 py-2 font-bold">{row.totalStock}</td>
                    <td className="px-3 py-2">{row.totalReturned}</td>
                    <td className="px-3 py-2">{row.totalSold}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {row.lastPurchaseDate ? new Date(row.lastPurchaseDate).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        disabled={!row.canDelete || deletingId === row.stockGroupId}
                        title={!row.canDelete ? "Has sold qty — cannot delete from here" : "Delete this line"}
                        onClick={() => void deleteStockLine(row)}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-800 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deletingId === row.stockGroupId ? "…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(data.items || []).length === 0 ? (
              <p className="p-8 text-center text-sm text-black/50">No stock lines in this folder yet.</p>
            ) : null}
          </div>
        </>
      ) : !error ? (
        <p className="mt-8 text-sm text-black/55">Loading…</p>
      ) : null}
    </div>
  );
}
