"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { buildWhatsAppUrl } from "@/utils/whatsapp";
import { resolveProductCardImage } from "@/lib/partImages";
import TiltCard from "@/components/TiltCard";

function badgeClass(q) {
  if (q === "Original") return "bg-emerald-500/90 text-white ring-1 ring-white/30";
  if (q === "High" || q === "High Copy") return "bg-amber-500/95 text-black ring-1 ring-black/10";
  if (q === "Low" || q === "Low Copy") return "bg-zinc-600/95 text-white ring-1 ring-white/20";
  return "bg-zinc-600/95 text-white";
}

function categoryLabel(product) {
  const c = product?.category;
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && c.name) return c.name;
  return product?.categoryId?.name || "";
}

export default function HomeProductShowcaseCard({ product, index = 0 }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const img = resolveProductCardImage(product);
  const cat = categoryLabel(product);
  const wa = buildWhatsAppUrl(
    `Hello Chacha Mobile, I want to order: ${product.name} (${product.brand} ${product.model}) — ₹${product.price}`
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="group h-full"
    >
      <TiltCard className="h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_6px_28px_rgba(0,0,0,0.07)] transition duration-300 group-hover:border-brand/35 group-hover:shadow-[0_14px_44px_rgba(0,0,0,0.1)]">
        <Link href={`/product/${product._id}`} className="relative block aspect-[5/4] overflow-hidden bg-zinc-200 sm:aspect-[4/3]">
          <motion.div
            className="h-full w-full"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width:768px) 50vw, 25vw"
            />
          </motion.div>
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1 sm:text-[11px] ${badgeClass(product.quality)}`}
          >
            {product.quality}
          </span>
        </Link>

        <div className="flex flex-col p-4 sm:p-5">
          {cat ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand sm:text-[11px]">{cat}</p>
          ) : null}
          <Link href={`/product/${product._id}`}>
            <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug tracking-tight text-black transition group-hover:text-brand-dim sm:mt-2 sm:text-lg">
              {product.name}
            </h3>
          </Link>
          <p className="mt-0.5 text-xs text-black/50 sm:text-sm">
            {product.brand} · {product.model}
          </p>
          <p className="mt-2 text-xl font-black tracking-tight text-black sm:mt-3 sm:text-2xl">
            ₹{Number(product.price).toLocaleString("en-IN")}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 sm:mt-4 sm:gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addItem(product, 1);
                setAdded(true);
                setTimeout(() => setAdded(false), 1600);
              }}
              className="min-h-[42px] flex-1 rounded-xl bg-black py-2.5 text-center text-xs font-bold text-brand transition hover:bg-zinc-900 sm:min-h-[44px] sm:py-3 sm:text-sm"
            >
              {added ? "Added ✓" : "Add to cart"}
            </motion.button>
            <motion.a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="min-h-[42px] flex-1 rounded-xl border-2 border-black/10 bg-white py-2.5 text-center text-xs font-bold text-black transition hover:border-brand sm:min-h-[44px] sm:rounded-2xl sm:py-3 sm:text-sm"
            >
              WhatsApp
            </motion.a>
          </div>
        </div>
      </div>
      </TiltCard>
    </motion.article>
  );
}
