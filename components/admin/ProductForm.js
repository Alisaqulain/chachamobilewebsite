"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const qualities = ["Original", "High", "Low"];

function normalizeQuality(q) {
  if (q === "High Copy") return "High";
  if (q === "Low Copy") return "Low";
  return q || "High";
}

export default function ProductForm({ productId, initial }) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: initial?.name || "",
    categoryId: initial?.categoryId?._id || initial?.categoryId || "",
    brandId: initial?.brandId || "",
    modelId: initial?.modelId || "",
    price: initial?.price != null ? String(initial.price) : "",
    quality: normalizeQuality(initial?.quality),
    description: initial?.description || "",
    images: initial?.images?.length ? initial.images : [],
    featured: Boolean(initial?.featured),
  });

  useEffect(() => {
    (async () => {
      const [cRes, bRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/brands"),
      ]);
      const cJson = await cRes.json();
      const bJson = await bRes.json();
      if (cRes.ok) setCategories(cJson.categories || []);
      if (bRes.ok) setBrands(bJson.brands || []);
    })();
  }, []);

  useEffect(() => {
    if (!form.brandId) {
      setModels([]);
      return;
    }
    (async () => {
      const res = await fetch(`/api/models?brandId=${encodeURIComponent(form.brandId)}`);
      const data = await res.json();
      if (res.ok) setModels(data.models || []);
    })();
  }, [form.brandId]);

  function setField(key, value) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "brandId") {
        next.modelId = "";
      }
      return next;
    });
  }

  async function onUploadFile(e) {
    const list = Array.from(e.target.files || []);
    e.target.value = "";
    if (!list.length) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      for (const file of list) {
        fd.append("images", file);
      }
      const res = await fetch("/api/upload?kind=product", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const newUrls = Array.isArray(data.urls) && data.urls.length
        ? data.urls
        : data.url
          ? [data.url]
          : [];
      if (!newUrls.length) throw new Error("Upload failed");
      setForm((f) => ({ ...f, images: [...f.images, ...newUrls] }));
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
        name: form.name,
        categoryId: form.categoryId,
        brandId: form.brandId,
        modelId: form.modelId,
        price: Number(form.price),
        quality: form.quality,
        description: form.description,
        images: form.images,
        featured: form.featured,
      };
      const isEdit = Boolean(productId);
      const res = await fetch(isEdit ? `/api/products/${productId}` : "/api/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <label className="text-xs font-bold uppercase text-black/45">Product name</label>
        <input
          required
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-[#FFA500] focus:ring-2 focus:ring-[#FFA500]/30"
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase text-black/45">Brand</label>
        <select
          required
          value={form.brandId}
          onChange={(e) => setField("brandId", e.target.value)}
          className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-[#FFA500] focus:ring-2 focus:ring-[#FFA500]/30"
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

      <div>
        <label className="text-xs font-bold uppercase text-black/45">Model</label>
        <select
          required
          value={form.modelId}
          onChange={(e) => setField("modelId", e.target.value)}
          disabled={!form.brandId}
          className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-[#FFA500] focus:ring-2 focus:ring-[#FFA500]/30 disabled:opacity-50"
        >
          <option value="" disabled>
            {form.brandId ? "Select model" : "Select brand first"}
          </option>
          {models.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-bold uppercase text-black/45">Category (part type)</label>
        <select
          required
          value={form.categoryId}
          onChange={(e) => setField("categoryId", e.target.value)}
          className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-[#FFA500] focus:ring-2 focus:ring-[#FFA500]/30"
        >
          <option value="" disabled>
            Select category
          </option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold uppercase text-black/45">Price (₹)</label>
          <input
            required
            type="number"
            min={0}
            step={1}
            value={form.price}
            onChange={(e) => setField("price", e.target.value)}
            className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-[#FFA500] focus:ring-2 focus:ring-[#FFA500]/30"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-black/45">Quality</label>
          <select
            required
            value={form.quality}
            onChange={(e) => setField("quality", e.target.value)}
            className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-[#FFA500] focus:ring-2 focus:ring-[#FFA500]/30"
          >
            {qualities.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold uppercase text-black/45">Description</label>
        <textarea
          rows={5}
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-[#FFA500] focus:ring-2 focus:ring-[#FFA500]/30"
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase text-black/45">Images</label>
        <p className="mt-1 text-xs text-black/50">
          Stored as <code className="rounded bg-black/5 px-1">/uploads/products/…</code>
        </p>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          onChange={onUploadFile}
          disabled={uploading}
          className="mt-2 block w-full text-sm"
        />
        {uploading && <p className="mt-1 text-xs text-black/55">Uploading…</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {form.images.map((url) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border">
              <Image src={url} alt="" fill className="object-cover" sizes="80px" />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }))}
                className="absolute right-0 top-0 rounded-bl bg-black/70 px-1 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-black">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => setField("featured", e.target.checked)}
          className="h-4 w-4 accent-[#FFA500]"
        />
        Featured on home page
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-black px-6 py-2.5 text-sm font-bold text-[#FFA500] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-black/15 px-6 py-2.5 text-sm font-semibold text-black hover:bg-black/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
