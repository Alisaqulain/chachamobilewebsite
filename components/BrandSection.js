"use client";

import { BRAND_MODELS } from "@/data/mockData";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

const brands = Object.keys(BRAND_MODELS);

function BrandPanel({ brand, active, onToggle, goShop }) {
  const isOpen = active === brand;

  return (
    <motion.div
      layout
      className={`relative overflow-hidden rounded-2xl border transition-[border-color,box-shadow] duration-300 ${
        isOpen
          ? "border-brand/50 shadow-[0_12px_40px_rgba(255,102,0,0.15)]"
          : "border-black/[0.06] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:border-black/12 hover:shadow-[0_10px_32px_rgba(0,0,0,0.07)]"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(isOpen ? null : brand)}
        className="flex w-full items-center justify-between gap-2 px-5 py-5 text-left"
      >
        <span className="text-lg font-semibold tracking-tight text-black">{brand}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.05] text-black/45"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-black/[0.06] bg-gradient-to-b from-black/[0.02] to-transparent"
          >
            <div className="grid gap-2 p-4 pt-2">
              {BRAND_MODELS[brand].map((model) => (
                <motion.button
                  key={model}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => goShop(brand, model)}
                  className="surface-3d-hover rounded-2xl border border-black/[0.06] bg-white px-4 py-3 text-left text-sm font-medium text-black/80 shadow-sm transition hover:border-brand/45 hover:text-black"
                >
                  {model}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function BrandSection() {
  const router = useRouter();
  const [open, setOpen] = useState(null);

  function goShop(brand, model) {
    const params = new URLSearchParams();
    params.set("brand", brand);
    params.set("model", model);
    router.push(`/shop?${params.toString()}`);
  }

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-72 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,165,0,0.08),transparent_70%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Brands</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black sm:text-4xl">Shop by brand</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-black/55 sm:text-base">
          Expand a brand, pick a model — the shop opens with filters applied.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {brands.map((brand) => (
          <BrandPanel
            key={brand}
            brand={brand}
            active={open}
            onToggle={setOpen}
            goShop={goShop}
          />
        ))}
      </div>
    </section>
  );
}
