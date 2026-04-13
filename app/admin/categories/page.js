"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { slugify } from "@/utils/slugify";

const emptyForm = { name: "", slug: "", image: "" };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCategories(data.categories || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setError("");
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(cat) {
    setError("");
    setEditingId(cat._id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      image: cat.image || "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onUploadFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?kind=category", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const url = data.url || data.urls?.[0];
      if (!url) throw new Error("Upload failed");
      setForm((f) => ({ ...f, image: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() ? slugify(form.slug.trim()) : slugify(form.name.trim()),
        image: form.image.trim(),
      };
      const isEdit = Boolean(editingId);
      const res = await fetch(isEdit ? `/api/categories/${editingId}` : "/api/categories", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      closeModal();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(cat) {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    const res = await fetch(`/api/categories/${cat._id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Delete failed");
      return;
    }
    load();
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-black">Categories</h1>
          <p className="mt-1 text-sm text-black/60">Manage shop categories, slugs, and cover images.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-black shadow-md hover:bg-brand-dim"
        >
          + Add category
        </button>
      </div>

      {error && !modalOpen && (
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
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {categories.map((c) => (
                <tr key={c._id} className="hover:bg-zinc-50/80">
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-zinc-100">
                      {c.image ? (
                        <Image src={c.image} alt="" fill className="object-cover" sizes="48px" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-[10px] text-black/35">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-black">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-black/60">/{c.slug}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="font-semibold text-brand-dim hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(c)}
                      className="ml-3 font-semibold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categories.length === 0 && <p className="p-8 text-center text-sm text-black/55">No categories.</p>}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-black/10 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-extrabold text-black">{editingId ? "Edit category" : "Add category"}</h2>
              <button type="button" onClick={closeModal} className="rounded-lg p-1 text-black/50 hover:bg-black/5">
                ✕
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-black/45">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      slug: editingId ? f.slug : slugify(name),
                    }));
                  }}
                  className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-black/45">Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm font-mono outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-black/45">Category image</label>
                <p className="mt-1 text-xs text-black/50">JPG, PNG, or WebP — max 2MB. Stored under /public/uploads/categories.</p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={onUploadFile}
                  disabled={uploading}
                  className="mt-2 block w-full text-sm"
                />
                {uploading && <p className="mt-1 text-xs text-black/55">Uploading…</p>}
                {form.image && (
                  <div className="relative mt-3 h-28 w-full max-w-xs overflow-hidden rounded-xl border bg-zinc-100">
                    <Image src={form.image} alt="" fill className="object-cover" sizes="320px" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, image: "" }))}
                      className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-black px-6 py-2.5 text-sm font-bold text-brand disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-black/15 px-6 py-2.5 text-sm font-semibold text-black hover:bg-black/5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
