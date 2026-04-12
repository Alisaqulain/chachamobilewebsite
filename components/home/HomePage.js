"use client";

import HeroSlider from "@/components/HeroSlider";
import HomeCategoryMega from "@/components/home/HomeCategoryMega";
import HomeBrandShowcase from "@/components/home/HomeBrandShowcase";
import HomeProductShowcaseCard from "@/components/home/HomeProductShowcaseCard";
import HomeWhyChoose from "@/components/home/HomeWhyChoose";
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
    <div className="overflow-x-hidden bg-black">
      <HeroSlider />

      <HomeCategoryMega />

      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-900 to-black py-16 sm:py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(255,165,0,0.12),transparent)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55 }}
              className="max-w-2xl"
            >
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#FFA500]">Spotlight</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Featured picks
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/65 sm:text-base">
                Hand-picked SKUs from the catalogue — clear pricing, add to cart or WhatsApp in one tap.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.08 }}
            >
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-full border-2 border-[#FFA500] bg-[#FFA500] px-8 py-3.5 text-sm font-bold text-black shadow-md transition hover:bg-amber-400"
              >
                View full catalogue
              </Link>
            </motion.div>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
            {showcase.map((p, i) => (
              <HomeProductShowcaseCard key={p._id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      <HomeBrandShowcase />

      <HomeWhyChoose />

      <Testimonials />

      <section className="relative w-full overflow-hidden py-16 sm:py-24 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFA500] via-[#cc7700] to-black" />
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23000000\\' fill-opacity=\\'0.08\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-90" />

        <div className="relative mx-auto max-w-4xl px-6 py-4 text-center sm:px-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[clamp(2rem,5vw,3.5rem)] font-black leading-tight tracking-tight text-black drop-shadow-sm"
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
            className="mt-10 inline-flex min-h-[56px] min-w-[220px] items-center justify-center rounded-full bg-black px-10 text-base font-bold text-[#FFA500] shadow-[0_0_0_0_rgba(0,0,0,0.4)] ring-4 ring-black/30 transition hover:shadow-[0_0_60px_rgba(0,0,0,0.55)]"
          >
            Order on WhatsApp
          </motion.a>
        </div>
      </section>
    </div>
  );
}
