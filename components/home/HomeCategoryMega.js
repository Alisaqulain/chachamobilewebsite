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
    "group relative min-h-[180px] overflow-hidden rounded-2xl border border-zinc-200/80 shadow-sm sm:min-h-[200px] dark:border-white/10 lg:min-h-0";
  if (index === 0) {
    return `${base} sm:col-span-2 lg:col-span-2 lg:row-span-2 lg:rounded-3xl`;
  }
  if (index === 1) {
    return `${base} lg:col-span-2 lg:row-span-1 lg:rounded-3xl`;
  }
  return `${base} lg:col-span-1 lg:row-span-1 lg:rounded-3xl`;
}

export default function HomeCategoryMega() {
  const categories = useShopCategories();
  const megaTiles = useMemo(() => pickMegaTiles(categories, 4), [categories]);

  return (
    <section className="relative overflow-hidden bg-zinc-100 py-16 text-zinc-900 dark:bg-zinc-950/80 dark:text-white sm:py-20 lg:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Premium header — readable in OS light and dark mode */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="mb-8 flex items-center justify-center gap-4 sm:mb-10">
            <span className="h-px w-10 max-w-[20%] bg-gradient-to-r from-transparent to-zinc-400 dark:to-white/25 sm:w-16" />
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-300/80 bg-white px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-brand shadow-sm dark:border-white/15 dark:bg-white/[0.06] dark:shadow-[0_0_40px_rgba(255,102,0,0.12)] sm:text-[11px]">
              Shop by category
            </span>
            <span className="h-px w-10 max-w-[20%] bg-gradient-to-l from-transparent to-zinc-400 dark:to-white/25 sm:w-16" />
          </div>

          <h2 className="font-display text-[clamp(1.85rem,4.2vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-zinc-900 dark:text-white">
            Four walls of inventory
            <span className="mt-1 block text-zinc-600 sm:mt-0 sm:inline sm:before:content-['—_'] sm:before:text-zinc-400 dark:text-zinc-300 dark:sm:before:text-white/40">
              pick your lane
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-[15px] leading-relaxed text-zinc-600 dark:text-white/65 sm:text-base">
            Editorial-scale tiles with real photography. Each tile opens the shop with filters already set — a
            straight path through the warehouse.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-white/40">
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.05]">
              Live stock
            </span>
            <span className="hidden text-zinc-300 dark:text-white/20 sm:inline">·</span>
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.05]">
              URL-synced filters
            </span>
            <span className="hidden text-zinc-300 dark:text-white/20 sm:inline">·</span>
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.05]">
              B2B ready
            </span>
          </div>
        </motion.div>

        {/* Bento grid — capped height, subtle hover (native-friendly, no 3D tilt) */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:mt-16 lg:grid-cols-4 lg:grid-rows-2 lg:gap-4 lg:[min-height:min(52vh,560px)]">
          {megaTiles.map((item, index) => {
            const href = `/shop?category=${encodeURIComponent(String(item.slug || "").toLowerCase())}`;
            const isHero = index === 0;
            return (
              <motion.div
                key={item.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.22 } }}
                className={tileGridClass(index)}
              >
                <Link href={href} className="absolute inset-0 z-20" aria-label={`Shop ${item.label}`} />

                <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    className="object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
                    sizes={
                      isHero
                        ? "(max-width:1024px) 100vw, 50vw"
                        : "(max-width:1024px) 50vw, 25vw"
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20 transition duration-300 group-hover:from-black/90" />
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
                    <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-brand opacity-100 transition duration-300 lg:opacity-0 lg:group-hover:opacity-100">
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
