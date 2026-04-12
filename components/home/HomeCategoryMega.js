"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useShopCategories } from "@/hooks/useShopCategories";

const PREFERRED_MEGA_SLUGS = [
  "display",
  "battery",
  "folder-body",
  "charging-jack",
  "speaker",
  "camera",
];

function pickMegaTiles(categories, max = 4) {
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
  const out = [];
  for (const slug of PREFERRED_MEGA_SLUGS) {
    if (bySlug[slug]) out.push(bySlug[slug]);
    if (out.length >= max) return out;
  }
  for (const c of categories) {
    if (out.length >= max) break;
    if (!out.some((x) => x.slug === c.slug)) out.push(c);
  }
  return out.slice(0, max);
}

export default function HomeCategoryMega() {
  const categories = useShopCategories();
  const megaTiles = useMemo(() => pickMegaTiles(categories, 4), [categories]);

  return (
    <section className="relative overflow-hidden bg-zinc-950 py-16 sm:py-20 lg:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[500px] w-[500px] rounded-full bg-[#FFA500]/25 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-[#FFA500]/15 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#FFA500]">Shop by category</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Four walls of inventory — pick your lane
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/65 sm:text-base">
            Large format tiles with real photography. Hover to explore — every route lands in a filtered shop.
          </p>
        </motion.div>

        <div className="mt-12 grid min-h-[560px] grid-cols-1 gap-4 sm:min-h-[640px] sm:grid-cols-2 sm:gap-5 lg:mt-16 lg:min-h-[720px] lg:gap-6">
          {megaTiles.map((item, index) => {
            const href = `/shop?category=${encodeURIComponent(item.slug)}`;
            return (
              <motion.div
                key={item.slug}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative min-h-[240px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl sm:min-h-[280px] lg:min-h-[340px]"
              >
                <Link href={href} className="absolute inset-0 z-10" aria-label={`Shop ${item.label}`} />
                <Image
                  src={item.image}
                  alt=""
                  fill
                  className="object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
                  sizes="(max-width:640px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20 transition duration-500 group-hover:from-black/92 group-hover:via-black/55" />
                <div className="absolute inset-0 bg-[#FFA500]/0 transition duration-500 group-hover:bg-[#FFA500]/10" />

                <div className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center p-8 text-center">
                  <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl text-white backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:border-[#FFA500]/50 group-hover:bg-black/40">
                    {item.icon}
                  </span>
                  <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    {item.label}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm text-white/75">{item.blurb}</p>
                  <span className="mt-8 inline-flex translate-y-3 items-center justify-center rounded-full bg-[#FFA500] px-8 py-3 text-sm font-bold text-black opacity-0 shadow-lg ring-2 ring-[#FFA500]/40 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    Explore
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
