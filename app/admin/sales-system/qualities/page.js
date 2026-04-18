"use client";

import { useCallback, useEffect, useState } from "react";

const emptyEdit = { name: "", sortOrder: "0" };

export default function SalesQualitiesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyEdit);
  const [addForm, setAddForm] = useState({ name: "", sortOrder: "0" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/product-qualities");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setRows(j.qualities || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(row) {
    setError("");
    setEditingId(row._id);
    setForm({ name: row.name, sortOrder: String(row.sortOrder ?? 0) });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyEdit);
    setError("");
  }

  async function onSaveEdit(e) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/product-qualities/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          sortOrder: Number(form.sortOrder),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      closeModal();
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function onAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/product-qualities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          sortOrder: Number(addForm.sortOrder),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Add failed");
      setAddForm({ name: "", sortOrder: "0" });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(row) {
    if (!confirm(`Delete quality "${row.name}"? Products must not use this label.`)) return;
    const res = await fetch(`/api/product-qualities/${row._id}`, { method: "DELETE" });
    const j = await res.json();
    if (!res.ok) {
      alert(j.error || "Delete failed");
      return;
    }
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-black">Product qualities</h1>
      <p className="mt-1 text-sm text-black/60">
        Labels used on products, sales entry, and stock search. Default rows (Original, High, Low) are created automatically.
      </p>

      {error && !modalOpen ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      <form
        onSubmit={onAdd}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
      >
        <div className="min-w-[200px] flex-1">
          <label className="text-xs font-bold uppercase text-black/45">New quality name</label>
          <input
            required
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            placeholder="e.g. OEM, AAA"
          />
        </div>
        <div className="w-28">
          <label className="text-xs font-bold uppercase text-black/45">Sort</label>
          <input
            type="number"
            value={addForm.sortOrder}
            onChange={(e) => setAddForm((f) => ({ ...f, sortOrder: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-black disabled:opacity-60"
        >
          Add
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-sm text-black/55">Loading…</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Sort</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rows.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-3 font-medium text-black">{r.name}</td>
                  <td className="px-4 py-3 text-black/60">{r.slug}</td>
                  <td className="px-4 py-3 tabular-nums">{r.sortOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="text-sm font-semibold text-brand-dim hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(r)}
                        className="text-sm font-semibold text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-black/55">No qualities yet.</p>
        ) : null}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSaveEdit}
            className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold text-black">Edit quality</h2>
            <p className="mt-1 text-xs text-black/50">Renaming updates all products that use this label.</p>
            <div className="mt-4">
              <label className="text-xs font-bold uppercase text-black/45">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div className="mt-3">
              <label className="text-xs font-bold uppercase text-black/45">Sort order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-black px-4 py-2 text-sm font-bold text-brand disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
