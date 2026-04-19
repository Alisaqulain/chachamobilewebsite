"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/** Uncategorized — only products with no category on file. */
const SALES_CAT_OTHER = "__other_category__";
/** Qualities not in the admin list (legacy labels). */
const SALES_QUAL_OTHER = "__other_quality__";
/** Widen SKU list: ignore mobile / search text for this line. */
const SALES_SKU_BROWSE_ALL = "__browse_all_skus__";

function newRow() {
  return {
    categoryId: "",
    quality: "",
    mobileSearch: "",
    productId: "",
    browseAllSkus: false,
    quantity: 1,
    price: 0,
  };
}

function normalizeHaystack(p) {
  return `${p.name} ${p.brand || ""} ${p.model || ""} ${p.category || ""}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Split on whitespace so "iphone  12" still matches products with "iphone 12". */
function mobileSearchTokens(mobileSearch) {
  return mobileSearch
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function filterProductsForRow(products, row, qualitiesList) {
  const { categoryId, quality, mobileSearch, browseAllSkus } = row;
  const tokens = mobileSearchTokens(mobileSearch);
  const knownQualityNames = new Set((qualitiesList || []).map((q) => q.name));

  return products.filter((p) => {
    const cid = p.categoryId?._id ? String(p.categoryId._id) : "";

    if (categoryId === SALES_CAT_OTHER) {
      if (cid) return false;
    } else if (categoryId && cid !== categoryId) {
      return false;
    }

    if (quality === SALES_QUAL_OTHER) {
      if (knownQualityNames.has(p.quality)) return false;
    } else if (quality && p.quality !== quality) {
      return false;
    }

    if (browseAllSkus || tokens.length === 0) return true;
    const hay = normalizeHaystack(p);
    return tokens.every((t) => hay.includes(t));
  });
}

export default function AdminSalesPage() {
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([newRow()]);
  const [customerType, setCustomerType] = useState("walk_in");
  const [customerId, setCustomerId] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState([]);

  const loadMaster = useCallback(async () => {
    const [cRes, catRes, pRes, hRes, qRes] = await Promise.all([
      fetch("/api/customers"),
      fetch("/api/categories?scope=admin"),
      fetch("/api/products"),
      fetch("/api/sales"),
      fetch("/api/product-qualities"),
    ]);
    const cJson = await cRes.json();
    const catJson = await catRes.json();
    const pJson = await pRes.json();
    const hJson = await hRes.json();
    const qJson = await qRes.json();
    if (!cRes.ok) throw new Error(cJson.error || "Failed customers");
    if (!catRes.ok) throw new Error(catJson.error || "Failed categories");
    if (!pRes.ok) throw new Error(pJson.error || "Failed products");
    if (!hRes.ok) throw new Error(hJson.error || "Failed sales");
    if (!qRes.ok) throw new Error(qJson.error || "Failed qualities");
    setCustomers(cJson.customers || []);
    setCategories(catJson.categories || []);
    setProducts(pJson.products || []);
    setQualities(qJson.qualities || []);
    setHistory(hJson.sales || []);
  }, []);

  useEffect(() => {
    loadMaster().catch((e) => setError(e.message));
  }, [loadMaster]);

  const grandTotal = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.quantity || 0) * Number(r.price || 0), 0),
    [rows]
  );

  function updateRow(i, patch) {
    setRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== i) return r;
        const next = { ...r, ...patch };
        if (patch.productId != null && patch.productId) {
          next.browseAllSkus = false;
          const p = products.find((x) => x._id === patch.productId);
          if (p) next.price = Number(p.sellingPrice ?? p.price ?? 0);
        }
        if (
          patch.categoryId != null ||
          patch.quality != null ||
          patch.mobileSearch != null ||
          patch.browseAllSkus != null
        ) {
          if (patch.categoryId != null || patch.quality != null || patch.mobileSearch != null) {
            next.browseAllSkus = false;
          }
          const pickingProduct = Boolean(patch.productId);
          if (!pickingProduct) {
            const opts = filterProductsForRow(products, next, qualities);
            if (!opts.some((x) => x._id === next.productId)) next.productId = "";
          }
        }
        return next;
      })
    );
  }

  function addRow() {
    setRows((r) => [...r, newRow()]);
  }

  function removeRow(i) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (customerType === "saved" && !customerId) {
        throw new Error("Select a saved customer, or switch to Walk-in.");
      }
      const payload = {
        customerId: customerType === "saved" ? customerId : "",
        walkInName: customerType === "walk_in" ? walkInName : "",
        walkInPhone: customerType === "walk_in" ? walkInPhone : "",
        date,
        products: rows.map((r) => ({
          productId: r.productId,
          quantity: Number(r.quantity || 0),
          price: Number(r.price || 0),
        })),
      };
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save sale");
      setRows([newRow()]);
      setNotice("Sale saved. Stock reduced.");
      await loadMaster();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-black">Sales Entry</h1>
      <p className="mt-1 text-sm text-black/60">
        Walk-in or saved customer. Pick category, search mobile, quality — then SKU and live stock.
      </p>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p> : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-black/45">Customer type</p>
          <div className="mt-3 flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-black">
              <input
                type="radio"
                name="customerType"
                checked={customerType === "walk_in"}
                onChange={() => {
                  setCustomerType("walk_in");
                  setCustomerId("");
                }}
                className="h-4 w-4 accent-brand"
              />
              Walk-in customer (direct sale)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-black">
              <input
                type="radio"
                name="customerType"
                checked={customerType === "saved"}
                onChange={() => setCustomerType("saved")}
                className="h-4 w-4 accent-brand"
              />
              Select customer (saved)
            </label>
          </div>

          {customerType === "walk_in" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase text-black/45">Name (optional)</label>
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="e.g. Counter sale"
                  className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-black/45">Phone (optional)</label>
                <input
                  type="tel"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  placeholder="Not saved to customer list"
                  className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <label className="text-xs font-bold uppercase text-black/45">Customer</label>
              <select
                required={customerType === "saved"}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
              >
                <option value="" disabled>
                  Choose customer…
                </option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4">
            <label className="text-xs font-bold uppercase text-black/45">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-black">Line items</p>
          <p className="mt-1 text-xs text-black/50">
            Choose category and quality, type any brand or model name (free text) — matching SKUs appear. Use Other if
            needed.
          </p>

          <div className="mt-4 space-y-6">
            {rows.map((row, i) => {
              const options = filterProductsForRow(products, row, qualities);
              const p = products.find((x) => x._id === row.productId);
              const skuSelectValue = row.productId || (row.browseAllSkus ? SALES_SKU_BROWSE_ALL : "");
              const stock = Number(p?.stock ?? 0);

              return (
                <div key={i} className="rounded-xl border border-black/10 bg-zinc-50/80 p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="text-xs font-bold uppercase text-black/45">Category</label>
                      <select
                        value={row.categoryId}
                        onChange={(e) => updateRow(i, { categoryId: e.target.value })}
                        className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                      >
                        <option value="">All categories</option>
                        <option value={SALES_CAT_OTHER}>Other (no category on product)</option>
                        {categories.map((c) => (
                          <option key={c._id} value={String(c._id)}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-black/45">Mobile / search</label>
                      <input
                        type="search"
                        value={row.mobileSearch}
                        onChange={(e) => updateRow(i, { mobileSearch: e.target.value })}
                        placeholder="Type any mobile name, brand, or model…"
                        className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-black/45">Quality</label>
                      <select
                        value={row.quality}
                        onChange={(e) => updateRow(i, { quality: e.target.value })}
                        className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                      >
                        <option value="">Any quality</option>
                        <option value={SALES_QUAL_OTHER}>Other (not in list / legacy)</option>
                        {qualities.map((q) => (
                          <option key={q._id} value={q.name}>
                            {q.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold uppercase text-black/45">Product SKU</label>
                      <select
                        required
                        value={skuSelectValue}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === SALES_SKU_BROWSE_ALL) {
                            updateRow(i, { browseAllSkus: true, productId: "" });
                          } else {
                            updateRow(i, { browseAllSkus: false, productId: v });
                          }
                        }}
                        className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                      >
                        <option value="" disabled>
                          {options.length
                            ? "Select product…"
                            : "No match — widen search or pick Other below"}
                        </option>
                        <option value={SALES_SKU_BROWSE_ALL}>
                          Other — show all SKUs for this category and quality (ignore mobile text)
                        </option>
                        {options.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name} — {item.quality} — stock {item.stock}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col justify-end">
                      <p className="text-xs font-bold uppercase text-black/45">Available stock</p>
                      <p
                        className={`mt-1 text-2xl font-black tabular-nums ${
                          stock < 5 ? "text-red-600" : "text-emerald-700"
                        }`}
                      >
                        {row.productId ? stock : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-xs font-bold uppercase text-black/45">Qty</label>
                      <input
                        type="number"
                        min={1}
                        max={stock > 0 ? stock : undefined}
                        value={row.quantity}
                        onChange={(e) => updateRow(i, { quantity: Number(e.target.value || 0) })}
                        className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-black/45">Selling price</label>
                      <input
                        type="number"
                        min={0}
                        value={row.price}
                        onChange={(e) => updateRow(i, { price: Number(e.target.value || 0) })}
                        className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                      />
                    </div>
                    <div className="flex items-end justify-between gap-2 sm:flex-col sm:items-stretch">
                      <p className="text-sm font-bold text-black">
                        Line: ₹{(Number(row.quantity || 0) * Number(row.price || 0)).toLocaleString("en-IN")}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="rounded-full border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                      >
                        Remove line
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-4 w-full min-h-12 rounded-xl border-2 border-dashed border-black/20 text-sm font-bold text-black/70 hover:border-brand hover:text-black sm:w-auto sm:px-6"
          >
            + Add line
          </button>

          <div className="mt-6 flex flex-col gap-3 border-t border-black/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base font-black text-black">Grand total: ₹{grandTotal.toLocaleString("en-IN")}</p>
            <button
              type="submit"
              disabled={saving}
              className="min-h-12 rounded-full bg-brand px-8 text-sm font-bold text-black shadow-sm disabled:opacity-60"
            >
              {saving ? "Saving…" : "Submit sale"}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {history.map((h) => (
              <tr key={h._id}>
                <td className="px-4 py-3 whitespace-nowrap">{new Date(h.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium text-black">{h.customerLabel || "—"}</td>
                <td className="px-4 py-3">{(h.products || []).length}</td>
                <td className="px-4 py-3 font-bold">₹{Number(h.totalAmount || 0).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 ? <p className="p-8 text-center text-sm text-black/55">No sales yet.</p> : null}
      </div>
    </div>
  );
}
