"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

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
  const img = product.images?.[0];
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
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group h-full"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_6px_28px_rgba(0,0,0,0.07)] transition duration-300 group-hover:border-[#FFA500]/35 group-hover:shadow-[0_14px_44px_rgba(0,0,0,0.1)]">
        <Link href={`/product/${product._id}`} className="relative block aspect-[4/5] overflow-hidden bg-zinc-200 sm:aspect-[3/4]">
          {img ? (
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
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-black/35">No image</div>
          )}
          <span
            className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur-sm ${badgeClass(product.quality)}`}
          >
            {product.quality}
          </span>
        </Link>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          {cat ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFA500]">{cat}</p>
          ) : null}
          <Link href={`/product/${product._id}`}>
            <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug tracking-tight text-black transition group-hover:text-[#cc7700] sm:text-xl">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 text-sm text-black/50">
            {product.brand} · {product.model}
          </p>
          <p className="mt-4 text-2xl font-black tracking-tight text-black">
            ₹{Number(product.price).toLocaleString("en-IN")}
          </p>

          <div className="mt-5 flex flex-1 flex-wrap gap-3">
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
              className="min-h-[48px] flex-1 rounded-xl bg-black py-3 text-center text-sm font-bold text-[#FFA500] transition hover:bg-zinc-900"
            >
              {added ? "Added ✓" : "Add to cart"}
            </motion.button>
            <motion.a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="min-h-[48px] flex-1 rounded-2xl border-2 border-black/10 bg-white py-3 text-center text-sm font-bold text-black transition hover:border-[#FFA500]"
            >
              WhatsApp
            </motion.a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
