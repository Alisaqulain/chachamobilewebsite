"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HERO_SLIDES } from "@/data/homeHero";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

const HERO_VIDEO_SRC = "/Video_about_mobile_202604132324.mp4";

const INTERVAL_MS = 7500;

const easeOut = [0.22, 1, 0.36, 1];

const slideVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const staggerParent = {
  enter: {},
  center: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
  exit: {},
};

const staggerItem = {
  enter: { opacity: 0, y: 20 },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: easeOut },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.28 } },
};

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
    <section className="relative w-full overflow-hidden bg-black">
      <div className="relative min-h-[min(92svh,860px)] w-full">
        {/* Full bleed from viewport top; MainShell uses pt-0 on / so video sits under fixed navbar */}
        <div className="absolute inset-0 z-0">
          <video
            className="absolute inset-0 h-full w-full object-cover object-center"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
          >
            <source src={HERO_VIDEO_SRC} type="video/mp4" />
          </video>
          <div
            className="absolute inset-0 bg-black/55"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/50"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_45%,rgba(0,0,0,0.35),transparent_70%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_0%,rgba(255,102,0,0.12),transparent_55%)]"
            aria-hidden
          />
        </div>

        {/* Fine grid — matches site shell, very subtle */}
        <div
          className="pointer-events-none absolute inset-0 z-[2] opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)`,
            backgroundSize: "56px 56px",
          }}
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex min-h-[min(92svh,860px)] max-w-7xl flex-col items-center px-5 pb-14 pt-[calc(4.5rem+3rem)] text-center sm:px-8 sm:pb-12 sm:pt-[calc(4.5rem+4rem)] lg:px-12 lg:pt-[calc(4.5rem+5rem)]">
          <div className="flex w-full max-w-3xl flex-1 flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <motion.div
                  className="relative mx-auto flex flex-col items-center"
                  variants={staggerParent}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <motion.div variants={staggerItem} className="flex justify-center">
                    <span className="inline-flex items-center gap-2.5 rounded-full border border-brand/35 bg-brand/[0.12] px-3.5 py-1.5 shadow-[0_0_48px_rgba(255,102,0,0.14)] backdrop-blur-md">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand shadow-[0_0_10px_rgba(255,102,0,0.9)]" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-brand sm:text-[11px]">
                        Chacha Mobile
                      </span>
                    </span>
                  </motion.div>

                  <motion.h1
                    variants={staggerItem}
                    className="font-display mt-7 text-balance text-[clamp(2.125rem,6vw,3.75rem)] font-extrabold leading-[1.04] tracking-[-0.02em] text-white"
                  >
                    {active.headline}
                  </motion.h1>

                  <motion.p
                    variants={staggerItem}
                    className="mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-white/72 sm:text-lg sm:leading-relaxed"
                  >
                    {active.subline}
                  </motion.p>

                  <motion.div variants={staggerItem} className="relative mt-8 w-full">
                    <div
                      aria-hidden
                      className="mx-auto mb-6 h-px max-w-xs bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    />
                    <ul className="flex flex-wrap justify-center gap-2 sm:gap-2.5" aria-label="Highlights">
                      {["QC-checked picks", "Grade on invoice", "Human WhatsApp desk"].map((tag) => (
                        <li
                          key={tag}
                          className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.06] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:px-4 sm:text-[11px] sm:tracking-[0.16em]"
                        >
                          <span className="text-brand" aria-hidden>
                            ✓
                          </span>
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  <motion.div
                    variants={staggerItem}
                    className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
                  >
                    <Link
                      href={active.shopHref}
                      className="btn-3d-pop group inline-flex min-h-[52px] min-w-[158px] items-center justify-center rounded-full bg-gradient-to-r from-brand via-brand to-brand-bright px-9 text-sm font-bold text-black shadow-[0_4px_28px_rgba(255,102,0,0.45)] ring-1 ring-white/15 transition duration-300 hover:shadow-[0_8px_40px_rgba(255,102,0,0.55)] hover:brightness-[1.03] active:scale-[0.98]"
                    >
                      <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                        Shop now
                      </span>
                    </Link>
                    <a
                      href={buildWhatsAppUrl(active.waMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-3d-pop inline-flex min-h-[52px] min-w-[158px] items-center justify-center rounded-full border border-white/25 bg-white/[0.07] px-9 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition duration-300 hover:border-brand/50 hover:bg-white/[0.12] hover:shadow-[0_0_32px_rgba(255,102,0,0.12)] active:scale-[0.98]"
                    >
                      WhatsApp
                    </a>
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-auto flex items-center justify-center gap-1.5 pt-10 sm:pt-12">
            <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/25 px-3 py-2.5 backdrop-blur-md">
              {HERO_SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Show slide ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => setIndex(i)}
                  className={`rounded-full transition-all duration-500 ease-out ${
                    i === index
                      ? "h-2 w-10 bg-gradient-to-r from-brand to-brand-bright shadow-[0_0_16px_rgba(255,102,0,0.5)]"
                      : "h-2 w-2 bg-white/30 hover:bg-white/55 hover:ring-2 hover:ring-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
