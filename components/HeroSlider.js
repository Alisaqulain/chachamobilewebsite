"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HERO_SLIDES } from "@/data/homeHero";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

const INTERVAL_MS = 7000;

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const active = HERO_SLIDES[index] || HERO_SLIDES[0];

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-zinc-950">
      <div className="relative min-h-[min(90svh,820px)] w-full">
        <div className="absolute inset-0">
          {HERO_SLIDES.map((s, i) => (
            <div
              key={s.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
                i === index ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              aria-hidden={i !== index}
            >
              <Image
                src={s.bgImage}
                alt=""
                fill
                priority={i === 0}
                className="object-cover object-center"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-black/55" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-zinc-900/50" />
            </div>
          ))}
        </div>

        <div className="relative z-10 mx-auto flex min-h-[min(90svh,820px)] max-w-6xl flex-col px-5 pb-20 pt-28 sm:px-8 sm:pb-16 sm:pt-32 lg:px-10">
          <div className="flex flex-1 flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-2xl"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#FFA500]">
                  Chacha Mobile
                </p>
                <h1 className="mt-4 text-[clamp(2rem,5.5vw,3.35rem)] font-bold leading-[1.06] tracking-tight text-white">
                  {active.headline}
                </h1>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-white/82 sm:text-lg">
                  {active.subline}
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <Link
                    href={active.shopHref}
                    className="inline-flex min-h-[48px] min-w-[140px] items-center justify-center rounded-full bg-[#FFA500] px-8 text-sm font-bold text-black transition hover:bg-amber-400"
                  >
                    Shop now
                  </Link>
                  <a
                    href={buildWhatsAppUrl(active.waMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[48px] min-w-[140px] items-center justify-center rounded-full border border-white/25 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-[#FFA500]/60 hover:bg-white/15"
                  >
                    WhatsApp
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-center gap-2 pb-2 sm:justify-start">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? "w-9 bg-[#FFA500]" : "w-2 bg-white/35 hover:bg-white/55"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
