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

function tileGridClass(index) {
  const base =
    "group relative min-h-[220px] overflow-hidden rounded-[1.35rem] sm:min-h-[240px] sm:rounded-[1.5rem] lg:min-h-0";
  if (index === 0) {
    return `${base} sm:col-span-2 lg:col-span-2 lg:row-span-2 lg:rounded-[1.75rem]`;
  }
  if (index === 1) {
    return `${base} lg:col-span-2 lg:row-span-1 lg:rounded-[1.75rem]`;
  }
  return `${base} lg:col-span-1 lg:row-span-1 lg:rounded-[1.75rem]`;
}

export default function HomeCategoryMega() {
  const categories = useShopCategories();
  const megaTiles = useMemo(() => pickMegaTiles(categories, 4), [categories]);

  return (
    <section className="relative overflow-hidden bg-transparent py-20 sm:py-24 lg:py-32">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Premium header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="mb-8 flex items-center justify-center gap-4 sm:mb-10">
            <span className="h-px w-10 max-w-[20%] bg-gradient-to-r from-transparent to-white/25 sm:w-16" />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-brand shadow-[0_0_40px_rgba(255,102,0,0.12)] backdrop-blur-md sm:text-[11px]">
              Shop by category
            </span>
            <span className="h-px w-10 max-w-[20%] bg-gradient-to-l from-transparent to-white/25 sm:w-16" />
          </div>

          <h2 className="font-display text-[clamp(1.85rem,4.2vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-white">
            Four walls of inventory
            <span className="mt-1 block bg-gradient-to-r from-white via-white to-white/55 bg-clip-text text-transparent sm:mt-0 sm:inline sm:before:content-['—_'] sm:before:text-white/40">
              pick your lane
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-[15px] leading-relaxed text-white/55 sm:text-base">
            Editorial-scale tiles with real photography. Hover for depth — each path opens the shop with filters
            already set, like a concierge route through the warehouse.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 backdrop-blur-sm">
              Live stock
            </span>
            <span className="hidden text-white/20 sm:inline">·</span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 backdrop-blur-sm">
              URL-synced filters
            </span>
            <span className="hidden text-white/20 sm:inline">·</span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 backdrop-blur-sm">
              B2B ready
            </span>
          </div>
        </motion.div>

        {/* Bento grid: hero tile left, 3 tiles right */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-20 lg:grid-cols-4 lg:grid-rows-2 lg:gap-5 lg:gap-x-5 lg:gap-y-5 lg:[min-height:min(72vh,820px)]">
          {megaTiles.map((item, index) => {
            const href = `/shop?category=${encodeURIComponent(item.slug)}`;
            const isHero = index === 0;
            return (
              <motion.div
                key={item.slug}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{
                  y: -10,
                  rotateX: 2.8,
                  rotateY: index % 2 === 0 ? -2 : 2,
                  scale: 1.01,
                  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                }}
                style={{ transformStyle: "preserve-3d", transformPerspective: 1200 }}
                className={tileGridClass(index)}
              >
                {/* Gradient frame */}
                <div className="pointer-events-none absolute inset-0 z-[2] rounded-[inherit] shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_24px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/10 transition duration-500 group-hover:shadow-[0_0_0_1px_rgba(255,165,0,0.35)_inset,0_32px_90px_rgba(0,0,0,0.5)] group-hover:ring-brand/30" />

                <Link href={href} className="absolute inset-0 z-20" aria-label={`Shop ${item.label}`} />

                <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    className="object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                    sizes={
                      isHero
                        ? "(max-width:1024px) 100vw, 50vw"
                        : "(max-width:1024px) 50vw, 25vw"
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/25 transition duration-500 group-hover:from-black/95 group-hover:via-black/60" />
                  <div className="absolute inset-0 bg-gradient-to-br from-brand/0 via-transparent to-indigo-900/20 opacity-0 transition duration-500 group-hover:opacity-100" />
                  {/* Hover shine */}
                  <div className="pointer-events-none absolute inset-0 z-[1] -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition duration-700 ease-out group-hover:translate-x-full group-hover:opacity-100" />
                </div>

                <div className="pointer-events-none absolute inset-0 z-[3] flex flex-col justify-end p-6 sm:p-7 lg:p-8">
                  <div
                    className={
                      isHero
                        ? "max-w-lg"
                        : "lg:max-w-[none]"
                    }
                  >
                    <span
                      className={`mb-3 inline-flex items-center justify-center rounded-xl border border-white/20 bg-black/30 text-white shadow-lg backdrop-blur-md transition duration-300 group-hover:border-brand/45 group-hover:bg-black/50 ${
                        isHero ? "h-16 w-16 text-3xl" : "h-12 w-12 text-xl sm:h-14 sm:w-14 sm:text-2xl"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <h3
                      className={`font-display font-bold tracking-tight text-white drop-shadow-md ${
                        isHero
                          ? "text-2xl sm:text-3xl lg:text-4xl xl:text-[2.65rem] xl:leading-tight"
                          : "text-xl sm:text-2xl lg:text-[1.35rem] xl:text-2xl"
                      }`}
                    >
                      {item.label}
                    </h3>
                    <p
                      className={`mt-2 text-white/70 transition duration-300 group-hover:text-white/85 ${
                        isHero ? "max-w-md text-sm sm:text-base" : "text-xs sm:text-sm"
                      }`}
                    >
                      {item.blurb}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-brand opacity-0 transition duration-300 group-hover:opacity-100">
                      Enter aisle
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
