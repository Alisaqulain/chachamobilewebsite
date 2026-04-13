"use client";

import { useCallback, useEffect, useState } from "react";

export default function AdminModelsPage() {
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [brandId, setBrandId] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadBrands() {
    const res = await fetch("/api/brands", { credentials: "include" });
    const data = await res.json();
    if (res.ok) setBrands(data.brands || []);
  }

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const q = brandId ? `?brandId=${encodeURIComponent(brandId)}` : "";
      const res = await fetch(`/api/models${q}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setModels(data.models || []);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  async function add(e) {
    e.preventDefault();
    setError("");
    if (!brandId) {
      setError("Select a brand");
      return;
    }
    const res = await fetch("/api/models", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId, name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setName("");
    loadModels();
  }

  async function remove(id) {
    if (!confirm("Delete this model?")) return;
    const res = await fetch(`/api/models/${id}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Delete failed");
      return;
    }
    loadModels();
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-black">Models</h1>
      <p className="mt-1 text-sm text-black/60">Models belong to a brand and drive dependent dropdowns.</p>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <form
        onSubmit={add}
        className="mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl border border-black/10 bg-white p-5 shadow-sm lg:flex-row lg:items-end"
      >
        <div className="flex-1">
          <label className="text-xs font-bold uppercase text-black/45">Brand</label>
          <select
            required
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            <option value="" disabled>
              Select brand
            </option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold uppercase text-black/45">Model name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            placeholder="e.g. iPhone 15"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-black"
        >
          Add model
        </button>
      </form>

      {loading ? (
        <p className="mt-8 text-sm text-black/55">Loading…</p>
      ) : (
        <ul className="mt-8 divide-y divide-black/10 rounded-2xl border border-black/10 bg-white shadow-sm">
          {models.map((m) => (
            <li key={m._id} className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="font-semibold text-black">{m.name}</p>
                <p className="text-xs text-black/45">{m.brandId?.name || "—"}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(m._id)}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
          {models.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-black/55">No models for this filter.</li>
          )}
        </ul>
      )}
    </div>
  );
}
