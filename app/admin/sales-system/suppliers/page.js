"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const empty = { name: "", phone: "", address: "" };

export default function SalesSystemSuppliersPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/suppliers");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setRows(j.suppliers || []);
    } catch (e) {
      setToast(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!toast || toast.includes("Failed")) return;
    const t = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      setForm(empty);
      setToast("Supplier saved");
      await load();
    } catch (e) {
      setToast(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(s) {
    if (!confirm(`Delete supplier "${s.name}"?`)) return;
    const res = await fetch(`/api/suppliers/${s._id}`, { method: "DELETE" });
    const j = await res.json();
    if (!res.ok) {
      setToast(j.error || "Delete failed");
      return;
    }
    setToast("Supplier removed");
    await load();
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-black">Suppliers</h1>
      <p className="mt-1 text-sm text-black/60">
        Default <strong>Unknown Supplier</strong> is created automatically. Open a supplier to add purchases and track
        stock.
      </p>

      {toast ? (
        <p
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            toast.includes("Failed") || toast.includes("Cannot") || toast.includes("error")
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {toast}
        </p>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
      >
        <input
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Supplier name"
          className="min-h-12 rounded-lg border border-black/15 px-3 text-sm"
        />
        <input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="Phone (optional)"
          className="min-h-12 rounded-lg border border-black/15 px-3 text-sm"
        />
        <input
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          placeholder="Address (optional)"
          className="min-h-12 rounded-lg border border-black/15 px-3 text-sm sm:col-span-2 lg:col-span-1"
        />
        <button
          type="submit"
          disabled={saving}
          className="min-h-12 rounded-lg bg-black px-4 text-sm font-bold text-brand disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add supplier"}
        </button>
      </form>

      {loading ? (
        <p className="mt-8 text-sm text-black/55">Loading…</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rows.map((s) => (
                <tr key={s._id}>
                  <td className="px-4 py-3 font-semibold text-black">{s.name}</td>
                  <td className="px-4 py-3 text-black/70">{s.phone || "—"}</td>
                  <td className="px-4 py-3 text-black/70">{s.address || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/sales-system/suppliers/${s._id}`}
                      className="mr-3 inline-block min-h-10 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-black"
                    >
                      Purchases
                    </Link>
                    {s.name !== "Unknown Supplier" ? (
                      <button type="button" onClick={() => remove(s)} className="text-xs font-bold text-red-600">
                        Delete
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
