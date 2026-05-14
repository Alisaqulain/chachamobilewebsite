"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { INSTAGRAM_URL, SITE_NAME } from "@/lib/site-config";

export default function HomeInstagramCta() {
  async function shareSite() {
    const payload = {
      title: SITE_NAME,
      text: "Mobile spare parts supplier — Muzaffarnagar, Meerut, Shamli & UP. Order on WhatsApp.",
      url: typeof window !== "undefined" ? window.location.origin : "https://chachamobile.in",
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else {
        await navigator.clipboard.writeText(payload.url);
        alert("Link copied — paste in WhatsApp or Instagram.");
      }
    } catch {
      /* dismissed */
    }
  }

  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-950" />
      <div className="pointer-events-none absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-brand/20 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand">Social proof</p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Follow drops on Instagram
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/65 sm:text-base">
              New arrivals, grade comparisons, and counter-ready bundles — see the quality before you message us for
              stock.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-3d-pop inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-8 text-sm font-bold text-white shadow-lg"
              >
                @chacha__mobile
              </a>
              <button
                type="button"
                onClick={shareSite}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white/85 transition hover:bg-white/5"
              >
                Share site
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="grid grid-cols-2 gap-3 sm:gap-4"
          >
            {[
              { src: "/display.jpg", label: "Displays" },
              { src: "/battery.jpg", label: "Batteries" },
              { src: "/camera.jpg", label: "Cameras" },
              { src: "/charging.jpg", label: "Charging" },
            ].map((tile) => (
              <a
                key={tile.label}
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-lg transition hover:border-brand/40"
              >
                <Image
                  src={tile.src}
                  alt=""
                  fill
                  className="object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                  sizes="200px"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 text-xs font-bold uppercase tracking-wide text-white">
                  {tile.label}
                </span>
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
