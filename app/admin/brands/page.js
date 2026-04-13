"use client";

import { useEffect, useState } from "react";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/brands", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setBrands(data.brands || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/brands", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setName("");
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this brand?")) return;
    const res = await fetch(`/api/brands/${id}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Delete failed");
      return;
    }
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-black">Brands</h1>
      <p className="mt-1 text-sm text-black/60">Brands appear in product form and shop filters.</p>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <form
        onSubmit={add}
        className="mt-8 flex max-w-xl flex-col gap-3 rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="text-xs font-bold uppercase text-black/45">New brand</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            placeholder="e.g. Apple"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-black"
        >
          Add
        </button>
      </form>

      {loading ? (
        <p className="mt-8 text-sm text-black/55">Loading…</p>
      ) : (
        <ul className="mt-8 divide-y divide-black/10 rounded-2xl border border-black/10 bg-white shadow-sm">
          {brands.map((b) => (
            <li key={b._id} className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="font-semibold text-black">{b.name}</p>
                <p className="text-xs text-black/45">/{b.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(b._id)}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
          {brands.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-black/55">No brands yet.</li>
          )}
        </ul>
      )}
    </div>
  );
}
