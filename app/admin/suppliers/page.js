"use client";

import { useEffect, useState } from "react";

const emptyForm = { name: "", phone: "", address: "" };

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSuppliers(data.suppliers || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setForm(emptyForm);
      setNotice("Supplier added");
      await load();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(row) {
    if (!confirm(`Delete supplier "${row.name}"?`)) return;
    const res = await fetch(`/api/suppliers/${row._id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Delete failed");
      return;
    }
    await load();
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-black">Suppliers</h1>
      <p className="mt-1 text-sm text-black/60">Add suppliers and keep your purchase parties clean.</p>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p> : null}

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
      >
        <input
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Supplier name"
          className="rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
        <input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="Phone"
          className="rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
        <input
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          placeholder="Address"
          className="rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand sm:col-span-2 lg:col-span-1"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-black shadow-sm disabled:opacity-60"
        >
          {saving ? "Saving…" : "Add supplier"}
        </button>
      </form>

      {loading ? (
        <p className="mt-8 text-sm text-black/60">Loading…</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {suppliers.map((s) => (
                <tr key={s._id}>
                  <td className="px-4 py-3 font-semibold text-black">{s.name}</td>
                  <td className="px-4 py-3 text-black/70">{s.phone || "—"}</td>
                  <td className="px-4 py-3 text-black/70">{s.address || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => remove(s)} className="font-semibold text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {suppliers.length === 0 ? <p className="p-8 text-center text-sm text-black/55">No suppliers yet.</p> : null}
        </div>
      )}
    </div>
  );
}
