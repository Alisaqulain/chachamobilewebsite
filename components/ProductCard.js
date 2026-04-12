"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

function badgeClass(q) {
  if (q === "Original") return "bg-emerald-500/15 text-emerald-800 ring-emerald-500/20";
  if (q === "High" || q === "High Copy") return "bg-amber-500/15 text-amber-900 ring-amber-500/25";
  if (q === "Low" || q === "Low Copy") return "bg-zinc-500/10 text-zinc-700 ring-zinc-500/15";
  return "bg-zinc-500/10 text-zinc-700 ring-zinc-500/15";
}

function categoryLabel(product) {
  const c = product?.category;
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && c.name) return c.name;
  return product?.categoryId?.name || "";
}

export default function ProductCard({ product, index = 0 }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const img = product.images?.[0];
  const cat = categoryLabel(product);
  const wa = buildWhatsAppUrl(
    `Hello Chacha Mobile, I want to order: ${product.name} (${product.brand} ${product.model}) — ₹${product.price}`
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-36px" }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      className="h-full"
    >
      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-[#FFA500]/35 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)]">
        <Link href={`/product/${product._id}`} className="relative block aspect-[4/5] overflow-hidden bg-zinc-100">
          {img ? (
            <div className="h-full w-full overflow-hidden">
              <Image
                src={img}
                alt={product.name}
                fill
                className="object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
                sizes="(max-width:768px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-black/35">No image</div>
          )}
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 backdrop-blur-md ${badgeClass(product.quality)}`}
          >
            {product.quality}
          </span>
        </Link>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {cat ? (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FFA500]">{cat}</p>
          ) : null}
          <Link href={`/product/${product._id}`}>
            <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug tracking-tight text-black transition group-hover:text-[#cc7700]">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 text-xs text-black/50">
            {product.brand} · {product.model}
          </p>
          <p className="mt-3 text-lg font-semibold tracking-tight text-black">
            ₹{Number(product.price).toLocaleString("en-IN")}
          </p>

          <div className="mt-4 flex flex-1 flex-wrap gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addItem(product, 1);
                setAdded(true);
                setTimeout(() => setAdded(false), 1600);
              }}
              className="flex-1 rounded-xl bg-black py-2.5 text-center text-xs font-semibold text-[#FFA500] transition hover:bg-zinc-900"
            >
              {added ? "Added ✓" : "Add to cart"}
            </button>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-xl border border-black/10 bg-zinc-50 py-2.5 text-center text-xs font-semibold text-black transition hover:border-[#FFA500]/40"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
