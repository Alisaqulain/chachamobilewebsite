"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { HOME_SHORTCUT_CATS } from "@/data/navCategories";
import TiltCard from "@/components/TiltCard";

function ShortcutCard({ item, index }) {
  const href = `/shop?category=${encodeURIComponent(item.slug || item.filter)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
    >
      <Link href={href} className="block h-full">
        <TiltCard className="h-full">
        <div className="group relative h-full overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition duration-300 hover:border-brand/35 hover:shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
          <div className="relative aspect-[5/4] overflow-hidden bg-zinc-100">
            <Image
              src={item.image}
              alt=""
              fill
              className="object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
              sizes="(max-width:768px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-lg text-black shadow-sm backdrop-blur">
              {item.icon}
            </span>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-lg font-semibold tracking-tight text-white drop-shadow-md">{item.label}</p>
              <p className="mt-0.5 text-xs text-white/80">{item.blurb}</p>
            </div>
          </div>
        </div>
        </TiltCard>
      </Link>
    </motion.div>
  );
}

export default function CategoryGrid() {
  return (
    <section className="relative border-t border-black/[0.04] bg-gradient-to-b from-white via-zinc-50/40 to-white py-16 sm:py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#FFA500]/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="max-w-2xl"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Quick path</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black sm:text-4xl">Shop by category</h2>
          <p className="mt-2 text-sm text-black/55 sm:text-base">
            Jump straight into filtered stock — one tap from the home page.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_SHORTCUT_CATS.map((item, index) => (
            <ShortcutCard key={item.slug + item.label} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
