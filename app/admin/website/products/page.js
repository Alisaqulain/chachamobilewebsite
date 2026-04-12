"use client";

import { motion } from "framer-motion";

const rows = [
  { sku: "DSP-IPH15P-O", name: "AMOLED Display — iPhone 15 Pro", price: "₹18,999", stock: "In stock" },
  { sku: "BAT-S24U-O", name: "Battery pack — Galaxy S24 Ultra", price: "₹3,499", stock: "Low" },
  { sku: "CHG-V29-HC", name: "Charge flex — Vivo V29 Pro", price: "₹890", stock: "In stock" },
  { sku: "CAM-RN11-O", name: "Rear camera — Oppo Reno 11", price: "₹6,200", stock: "Pre-order" },
];

export default function WebsiteAdminProductsPage() {
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">Products</h1>
          <p className="mt-1 text-sm text-black/50">Dummy catalogue table — UI only.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-2xl border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-sm"
          >
            Export
          </button>
          <button
            type="button"
            className="rounded-2xl bg-black px-5 py-2.5 text-sm font-semibold text-[#FFA500] shadow-md"
          >
            + Add product
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-sm"
      >
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/[0.06] bg-zinc-50/90 text-xs font-semibold uppercase tracking-wider text-black/45">
            <tr>
              <th className="px-5 py-4">SKU</th>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Price</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {rows.map((r) => (
              <tr key={r.sku} className="hover:bg-zinc-50/60">
                <td className="px-5 py-4 font-mono text-xs text-black/60">{r.sku}</td>
                <td className="px-5 py-4 font-medium text-black">{r.name}</td>
                <td className="px-5 py-4 text-black/80">{r.price}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-800">
                    {r.stock}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button type="button" className="text-xs font-semibold text-[#cc7700] hover:underline">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
