"use client";

import HeroSlider from "@/components/HeroSlider";
import HomeCategoryMega from "@/components/home/HomeCategoryMega";
import HomeBrandShowcase from "@/components/home/HomeBrandShowcase";
import HomeProductShowcaseCard from "@/components/home/HomeProductShowcaseCard";
import HomeWhyChoose from "@/components/home/HomeWhyChoose";
import HomeServiceFlow from "@/components/home/HomeServiceFlow";
import HomeStatsRibbon from "@/components/home/HomeStatsRibbon";
import Testimonials from "@/components/Testimonials";
import { MOCK_PRODUCTS } from "@/data/mockData";
import { motion } from "framer-motion";
import Link from "next/link";
import { buildWhatsAppUrl } from "@/utils/whatsapp";
import { useEffect, useState } from "react";

function pickFeaturedEightMock() {
  const featured = MOCK_PRODUCTS.filter((p) => p.featured);
  const rest = MOCK_PRODUCTS.filter((p) => !p.featured);
  return [...featured, ...rest].slice(0, 8);
}

export default function HomePage() {
  const [showcase, setShowcase] = useState(pickFeaturedEightMock());

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/products?featured=true", { cache: "no-store" });
        const data = await res.json();
        const list = data.products || [];
        if (list.length > 0) {
          const merged = [...list.filter((p) => p.featured), ...list.filter((p) => !p.featured)];
          setShowcase(merged.slice(0, 8));
        }
      } catch {
        /* keep mock */
      }
    })();
  }, []);
  const wa = buildWhatsAppUrl(
    "Hello Chacha Mobile, I need premium spare parts — please share stock and pricing."
  );

  return (
    <div className="flex flex-1 flex-col overflow-x-hidden bg-transparent">
      <HeroSlider />

      <HomeStatsRibbon />

      <HomeCategoryMega />

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
          <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55 }}
              className="relative max-w-2xl"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -left-4 top-0 h-24 w-px bg-gradient-to-b from-brand/80 via-brand/30 to-transparent sm:-left-5 sm:h-28"
              />
              <div className="relative border-l-2 border-brand/45 pl-5 sm:pl-6">
                <span className="inline-flex items-center gap-2.5 rounded-full border border-brand/35 bg-brand/[0.09] px-3.5 py-1.5 shadow-[0_0_40px_rgba(255,102,0,0.12)] backdrop-blur-sm">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand shadow-[0_0_8px_rgba(255,102,0,0.9)]" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand">
                    Spotlight
                  </span>
                </span>
                <h2 className="font-display mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
                  <span className="text-white">Featured </span>
                  <span className="bg-gradient-to-r from-brand via-brand-bright to-amber-200 bg-clip-text text-transparent">
                    picks
                  </span>
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
                  Hand-picked SKUs from the catalogue — clear pricing, add to cart or WhatsApp in one tap.
                </p>
                <ul className="mt-6 flex flex-wrap gap-2 sm:gap-2.5">
                  {["Transparent pricing", "Same-day dispatch", "Human WhatsApp support"].map((label) => (
                    <li
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-sm sm:text-xs"
                    >
                      <span className="text-brand" aria-hidden>
                        ✓
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="flex shrink-0 flex-col gap-3 lg:items-end"
            >
              <p className="text-left text-xs font-medium text-white/45 sm:max-w-md lg:max-w-[14rem] lg:text-right">
                Showing <span className="font-bold text-white/70">{showcase.length}</span> curated listings
                — refreshed from live stock when available.
              </p>
              <Link
                href="/shop"
                className="btn-3d-pop inline-flex min-h-[48px] min-w-[200px] items-center justify-center self-start rounded-full border-2 border-brand bg-brand px-8 py-3.5 text-sm font-bold text-black shadow-[0_4px_24px_rgba(255,102,0,0.35)] transition hover:border-brand-bright hover:bg-brand-bright hover:shadow-[0_8px_40px_rgba(255,102,0,0.45)] lg:self-end"
              >
                View full catalogue
              </Link>
              <p className="text-left text-[11px] leading-snug text-white/35 sm:max-w-md lg:max-w-[14rem] lg:text-right">
                On the shop page you can filter by brand, model, and part type.
              </p>
            </motion.div>
          </div>

          <div
            aria-hidden
            className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent sm:mt-14"
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7 sm:mt-14">
            {showcase.map((p, i) => (
              <HomeProductShowcaseCard key={p._id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      <HomeBrandShowcase />

      <HomeServiceFlow />

      <HomeWhyChoose />

      <Testimonials />

      <section className="relative w-full overflow-hidden py-16 sm:py-24 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand-dim to-black" />
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23000000\\' fill-opacity=\\'0.08\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-90" />

        <div className="relative mx-auto max-w-4xl px-6 py-4 text-center sm:px-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-display text-[clamp(2rem,5vw,3.5rem)] font-black leading-tight tracking-tight text-black drop-shadow-sm"
          >
            Need mobile parts?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="mx-auto mt-5 max-w-xl text-base font-medium text-black/80 sm:text-lg"
          >
            WhatsApp us for stock checks, compatibility, and same-day dispatch — a human replies, not a bot.
          </motion.p>
          <motion.a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="btn-3d-pop mt-10 inline-flex min-h-[56px] min-w-[220px] items-center justify-center rounded-full bg-black px-10 text-base font-bold text-brand shadow-[0_0_0_0_rgba(0,0,0,0.4)] ring-4 ring-black/30 transition hover:shadow-[0_0_60px_rgba(0,0,0,0.55)]"
          >
            Order on WhatsApp
          </motion.a>
        </div>
      </section>
    </div>
  );
}
