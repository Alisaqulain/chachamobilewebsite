"use client";

import Image from "next/image";
import Link from "next/link";
import { getMockProduct } from "@/data/mockData";
import { useCart } from "@/components/CartProvider";
import { buildWhatsAppUrl } from "@/utils/whatsapp";
import { motion } from "framer-motion";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";

function badgeClass(q) {
  if (q === "Original") return "bg-emerald-500/15 text-emerald-800 ring-emerald-500/20";
  if (q === "High" || q === "High Copy") return "bg-amber-500/15 text-amber-900 ring-amber-500/25";
  if (q === "Low" || q === "Low Copy") return "bg-zinc-500/10 text-zinc-700 ring-zinc-500/15";
  return "bg-zinc-500/10 text-zinc-700 ring-zinc-500/15";
}

function isMongoId(id) {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
}

export default function ProductDetailClient({ id }) {
  const { addItem } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(isMongoId(id));

  useEffect(() => {
    if (!isMongoId(id)) {
      setProduct(getMockProduct(id));
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/products/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.product) {
          setProduct(data.product);
        } else {
          setProduct(null);
        }
      } catch {
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center text-sm text-black/50 sm:px-6">
        Loading product…
      </div>
    );
  }

  if (!product) {
    notFound();
    return null;
  }

  const imgs = product.images?.length ? product.images : [];
  const main = imgs[activeImg] || imgs[0];
  const wa = buildWhatsAppUrl(
    `Hello Chacha Mobile, I want to order: ${product.name} (${product.brand} ${product.model}) — ₹${product.price}`
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-16">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 text-sm">
        <Link href="/shop" className="font-medium text-[#cc7700] hover:underline">
          ← Back to shop
        </Link>
      </motion.div>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-black/[0.06] bg-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            {main ? (
              <motion.div
                key={main}
                initial={{ opacity: 0.85, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="h-full w-full"
              >
                <Image src={main} alt={product.name} fill className="object-cover" priority />
              </motion.div>
            ) : (
              <div className="flex h-full items-center justify-center text-black/40">No image</div>
            )}
            <span
              className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 backdrop-blur-md ${badgeClass(product.quality)}`}
            >
              {product.quality}
            </span>
          </div>
          {imgs.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {imgs.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                    i === activeImg ? "border-[#FFA500] shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FFA500]">
            {product.category || product.categoryId?.name || ""}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            {product.name}
          </h1>
          <p className="mt-3 text-sm text-black/55">
            {product.brand} · <span className="font-medium text-black">{product.model}</span>
          </p>
          <p className="mt-8 text-4xl font-semibold tracking-tight text-black">
            ₹{Number(product.price).toLocaleString("en-IN")}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                addItem(product, 1);
                setAdded(true);
                setTimeout(() => setAdded(false), 2000);
              }}
              className="flex-1 rounded-2xl bg-black py-4 text-sm font-semibold text-[#FFA500] shadow-lg transition hover:bg-black/90"
            >
              {added ? "Added to cart ✓" : "Add to cart"}
            </motion.button>
            <motion.a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 rounded-2xl border-2 border-black/10 bg-white py-4 text-center text-sm font-semibold text-black transition hover:border-[#FFA500]/50"
            >
              Order on WhatsApp
            </motion.a>
          </div>

          <div className="mt-12 rounded-3xl border border-black/[0.06] bg-zinc-50/80 p-6 backdrop-blur-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-black/40">
              Description
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-black/70">
              {product.description}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
