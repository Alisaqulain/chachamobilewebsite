"use client";

import { useCallback, useEffect, useState } from "react";

export default function SalesSystemCategoriesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sales-categories");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load");
      setRows(j.categories || []);
    } catch (e) {
      setError(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  async function onAdd(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      setError("Enter a name");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/sales-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: n,
          ...(slug.trim() ? { slug: slug.trim() } : {}),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      setName("");
      setSlug("");
      setToast("Sales category added");
      await load();
    } catch (e) {
      setError(e.message || "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row) {
    if (!confirm(`Delete sales category “${row.name}”?`)) return;
    setError("");
    try {
      const res = await fetch(`/api/sales-categories/${row._id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Delete failed");
      setToast("Removed");
      await load();
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-black">Sales categories</h1>
      <p className="mt-2 text-sm text-black/60">
        Only for <strong>parts purchases and stock</strong>. Add whatever labels you need here — they show on the
        supplier purchase form. This is not the shop catalogue.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      {toast ? (
        <p className="mt-4 rounded-lg border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-black">{toast}</p>
      ) : null}

      <form onSubmit={onAdd} className="mt-8 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-black">Add sales category</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold uppercase text-black/45">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Display, Battery, Folder…"
              className="mt-1 min-h-11 w-full rounded-lg border border-black/15 px-3 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold uppercase text-black/45">Slug (optional)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Leave blank to auto-generate from name"
              className="mt-1 min-h-11 w-full rounded-lg border border-black/15 px-3 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 min-h-11 rounded-lg bg-black px-5 text-sm font-bold text-brand disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add category"}
        </button>
      </form>

      <h2 className="mt-10 text-sm font-bold text-black">Your sales categories</h2>
      {loading ? (
        <p className="mt-4 text-sm text-black/55">Loading…</p>
      ) : (
        <ul className="mt-3 divide-y divide-black/10 rounded-xl border border-black/10 bg-white shadow-sm">
          {rows.map((c) => (
            <li key={c._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="font-semibold text-black">{c.name}</p>
                <p className="text-xs text-black/45">Slug · {c.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(c)}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && rows.length === 0 ? (
        <p className="mt-4 text-sm text-black/55">No categories yet. Add one above.</p>
      ) : null}
    </div>
  );
}
