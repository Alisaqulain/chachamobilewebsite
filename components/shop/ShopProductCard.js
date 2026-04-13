"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { resolveProductCardImage } from "@/lib/partImages";
import TiltCard from "@/components/TiltCard";

function badgeClass(q) {
  if (q === "Original")
    return "bg-emerald-500/15 text-emerald-900 ring-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-400/30";
  if (q === "High" || q === "High Copy")
    return "bg-amber-500/20 text-amber-950 ring-amber-500/30 dark:bg-amber-500/25 dark:text-amber-50 dark:ring-amber-400/35";
  if (q === "Low" || q === "Low Copy")
    return "bg-zinc-500/15 text-zinc-800 ring-zinc-500/20 dark:bg-zinc-500/20 dark:text-zinc-100 dark:ring-zinc-400/25";
  return "bg-zinc-500/15 text-zinc-800 ring-zinc-500/20 dark:bg-zinc-500/20 dark:text-zinc-100 dark:ring-zinc-400/25";
}

function categoryLabel(product) {
  const c = product?.category;
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && c.name) return c.name;
  return product?.categoryId?.name || "";
}

export default function ShopProductCard({ product, index = 0, onOpenDetail }) {
  const img = resolveProductCardImage(product);
  const cat = categoryLabel(product);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-36px" }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      className="h-full"
    >
      <TiltCard className="h-full">
      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition duration-300 hover:border-brand/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] dark:border-white/[0.08] dark:bg-zinc-900 dark:shadow-[0_4px_28px_rgba(0,0,0,0.4)] dark:hover:border-brand/45">
        <button
          type="button"
          onClick={() => onOpenDetail?.(product)}
          className="relative block aspect-[4/5] w-full cursor-pointer overflow-hidden bg-zinc-100 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:bg-zinc-800 dark:focus-visible:ring-offset-zinc-900"
        >
          <div className="h-full w-full overflow-hidden">
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            />
          </div>
          <span
            className={`pointer-events-none absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 backdrop-blur-md ${badgeClass(product.quality)}`}
          >
            {product.quality}
          </span>
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-zinc-950/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm ring-1 ring-white/15">
            Tap for details
          </span>
        </button>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <button
            type="button"
            onClick={() => onOpenDetail?.(product)}
            className="w-full cursor-pointer text-left rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {cat ? (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{cat}</p>
            ) : null}
            <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug tracking-tight text-zinc-900 transition group-hover:text-brand-dim dark:text-zinc-50">
              {product.name}
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {product.brand} · {product.model}
            </p>
            <p className="mt-3 text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </p>
          </button>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-200 pt-3 dark:border-white/10">
            <button
              type="button"
              onClick={() => onOpenDetail?.(product)}
              className="rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-dim"
            >
              View &amp; buy
            </button>
            <Link
              href={`/product/${product._id}`}
              className="text-xs font-semibold text-brand-dim hover:underline dark:text-brand-bright"
              onClick={(e) => e.stopPropagation()}
            >
              Full page
            </Link>
          </div>
        </div>
      </div>
      </TiltCard>
    </motion.article>
  );
}
