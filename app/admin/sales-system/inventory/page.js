"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function SalesInventoryFoldersPage() {
  const [folders, setFolders] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linesLoading, setLinesLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  const loadFolders = useCallback(async () => {
    const res = await fetch("/api/inventory/folders");
    const j = await res.json();
    if (res.ok) setFolders(j.folders || []);
  }, []);

  const loadLines = useCallback(async () => {
    const res = await fetch("/api/inventory/stock-lines");
    const j = await res.json();
    if (res.ok) setLines(j.items || []);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadFolders();
      } finally {
        setLoading(false);
      }
    })();
  }, [loadFolders]);

  useEffect(() => {
    (async () => {
      setLinesLoading(true);
      try {
        await loadLines();
      } finally {
        setLinesLoading(false);
      }
    })();
  }, [loadLines]);

  async function deleteStockLine(row) {
    if (!row.canDelete) {
      window.alert("This line has sold quantity. It cannot be deleted from here.");
      return;
    }
    const label = `${row.mobileName} — ${row.productName} (${row.quality})`;
    if (!window.confirm(`Delete this stock line permanently?\n\n${label}\n\nThis removes all purchase and return history for this line.`)) {
      return;
    }
    setDeletingId(row.stockGroupId);
    try {
      const res = await fetch(`/api/inventory/stock-group/${row.stockGroupId}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Delete failed");
      await loadFolders();
      await loadLines();
    } catch (e) {
      window.alert(e.message || "Delete failed");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-black">Inventory by folder</h1>
      <p className="mt-1 text-sm text-black/60">
        Folders match the brand or family you enter on purchase (e.g. Oppo). Open one to see every model and quality
        line, or use the table below to delete a wrong entry.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-black/55">Loading…</p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {folders.map((f) => (
            <li key={f.name}>
              <Link
                href={`/admin/sales-system/inventory/folder/${encodeURIComponent(f.name)}`}
                className="flex min-h-14 items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold shadow-sm hover:border-brand"
              >
                <span>
                  {f.name}
                  <span className="ml-2 text-xs font-normal text-black/45">({f.lineCount} lines)</span>
                </span>
                <span className="text-black/35">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!loading && folders.length === 0 ? (
        <p className="mt-8 text-sm text-black/50">No parts stock yet. Add a purchase from a supplier.</p>
      ) : null}

      <section className="mt-12">
        <h2 className="text-lg font-bold text-black">All stock lines</h2>
        <p className="mt-1 text-xs text-black/50">
          Delete removes this folder/model/quality line and every linked supplier purchase and return. Not allowed if
          sold qty &gt; 0.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
              <tr>
                <th className="px-3 py-2">Folder</th>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Quality</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Sold</th>
                <th className="px-3 py-2">Last purchase</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {linesLoading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-black/50">
                    Loading…
                  </td>
                </tr>
              ) : (
                lines.map((row) => (
                  <tr key={row.stockGroupId}>
                    <td className="px-3 py-2">{row.mobileName}</td>
                    <td className="px-3 py-2 font-medium">{row.productName}</td>
                    <td className="px-3 py-2">{row.quality}</td>
                    <td className="px-3 py-2 text-black/70">{row.salesCategoryName}</td>
                    <td className="px-3 py-2 font-bold tabular-nums">{row.totalStock}</td>
                    <td className="px-3 py-2 tabular-nums">{row.totalSold}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-black/70">
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
                ))
              )}
            </tbody>
          </table>
          {!linesLoading && lines.length === 0 ? (
            <p className="p-8 text-center text-sm text-black/50">No stock lines yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
