"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PREFERRED = ["Apple", "Samsung", "Vivo", "Oppo"];

const brandMeta = {
  Apple: { tone: "from-zinc-200 via-zinc-100 to-zinc-400", text: "text-black" },
  Samsung: { tone: "from-blue-600 to-blue-900", text: "text-white" },
  Vivo: { tone: "from-indigo-500 to-violet-800", text: "text-white" },
  Oppo: { tone: "from-emerald-500 to-teal-900", text: "text-white" },
};

export default function HomeBrandShowcase() {
  const router = useRouter();
  const [open, setOpen] = useState(null);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/meta/filters", { cache: "no-store" });
        const data = await res.json();
        if (res.ok) {
          setBrands(data.brands || []);
          setModels(data.models || []);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const displayBrands = PREFERRED.map((name) => brands.find((b) => b.name === name)).filter(Boolean);

  function modelsForBrand(brandId) {
    return models.filter((m) => m.brandId && m.brandId._id === brandId);
  }

  function goShop(brandId, modelId) {
    const params = new URLSearchParams();
    if (brandId) params.set("brandId", brandId);
    if (modelId) params.set("modelId", modelId);
    router.push(`/shop?${params.toString()}`);
  }

  const openBrand = displayBrands.find((b) => b._id === open);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-900 to-black py-16 sm:py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(255,102,0,0.12),transparent)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-brand">Official-grade lineup</p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Brands technicians ask for first
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/65 sm:text-base">
            Tap a brand. Models load from your database. One tap opens the shop with live filters.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {displayBrands.map((b, i) => {
            const isOpen = open === b._id;
            const meta = brandMeta[b.name] || brandMeta.Apple;
            return (
              <motion.div
                key={b._id}
                layout
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br shadow-md transition duration-300 ${
                  isOpen
                    ? "border-brand shadow-lg ring-1 ring-brand/25"
                    : "border-black/[0.08] hover:border-brand/35 hover:shadow-lg"
                } ${meta.tone}`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : b._id)}
                  className="relative z-10 flex w-full flex-col items-center px-4 py-10 text-center lg:py-14"
                >
                  <span
                    className={`text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl ${meta.text} drop-shadow-md`}
                  >
                    {b.name}
                  </span>
                  <span className={`mt-4 text-xs font-semibold uppercase tracking-widest ${meta.text} opacity-70`}>
                    {isOpen ? "Close" : "View models"}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </div>

        {displayBrands.length === 0 && (
          <p className="mt-10 text-center text-sm text-white/50">
            Add brands in Admin → Brands to unlock this section.
          </p>
        )}

        <AnimatePresence initial={false}>
          {openBrand && (
            <motion.div
              key={openBrand._id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-8 rounded-3xl border border-black/[0.08] bg-black p-6 shadow-2xl sm:p-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-lg font-bold text-white">
                    {openBrand.name}{" "}
                    <span className="text-white/50">·</span>{" "}
                    <span className="text-sm font-medium text-brand">Pick a model</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(null)}
                    className="self-start rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white/80 hover:bg-white/10 sm:self-auto"
                  >
                    Collapse
                  </button>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  {modelsForBrand(openBrand._id).map((m) => (
                    <motion.button
                      key={m._id}
                      type="button"
                      layout
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => goShop(openBrand._id, m._id)}
                      className="surface-3d-hover rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-brand hover:bg-brand/15"
                    >
                      {m.name}
                    </motion.button>
                  ))}
                  {modelsForBrand(openBrand._id).length === 0 && (
                    <p className="text-sm text-white/50">No models yet — add them in Admin → Models.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
