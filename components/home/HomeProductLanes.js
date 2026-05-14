"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

const LANES = [
  {
    title: "Mobile displays",
    slug: "display",
    image: "/display.jpg",
    tag: "LCD · Incell · OLED",
    wa: "Hello Chacha Mobile — I need displays (quote models & grades).",
  },
  {
    title: "Batteries",
    slug: "battery",
    image: "/battery.jpg",
    tag: "OEM-style cells · tested packs",
    wa: "Hello Chacha Mobile — I need batteries for my shop.",
  },
  {
    title: "Charging flex & PCB",
    slug: "charging-jack",
    image: "/charging.jpg",
    tag: "Ports · flex · daughterboard",
    wa: "Hello Chacha Mobile — I need charging flex / PCB parts.",
  },
  {
    title: "Camera modules",
    slug: "camera",
    image: "/camera.jpg",
    tag: "Front · rear · bracket variants",
    wa: "Hello Chacha Mobile — I need camera modules.",
  },
  {
    title: "Back panels & body",
    slug: "folder-body",
    image: "/folder.jpg",
    tag: "Housing · frame · adhesive kits",
    wa: "Hello Chacha Mobile — I need back panels / body parts.",
  },
  {
    title: "Speakers & accessories",
    slug: "speaker",
    image: "/speaker.png",
    tag: "Earpiece · loudspeaker · smalls",
    wa: "Hello Chacha Mobile — I need speakers / small accessories.",
  },
];

export default function HomeProductLanes() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,102,0,0.14),transparent_55%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand">Catalogue lanes</p>
          <h2 className="font-display mt-3 text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight text-white">
            Every bench line, one premium aisle
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/65 sm:text-base">
            Tap a lane to open the shop with filters applied — or jump straight to WhatsApp with a lane-specific
            enquiry.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {LANES.map((lane, i) => (
            <motion.article
              key={lane.slug}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-24px" }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-brand/40 hover:shadow-[0_28px_70px_rgba(255,102,0,0.12)]"
            >
              <Link
                href={`/shop?category=${encodeURIComponent(lane.slug)}`}
                className="absolute inset-0 z-10"
                aria-label={`Shop ${lane.title}`}
              />
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={lane.image}
                  alt=""
                  fill
                  className="object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
                  sizes="(max-width:1024px) 100vw, 33vw"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 z-[11] flex items-end justify-between gap-3 p-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand">{lane.tag}</p>
                    <h3 className="font-display text-lg font-bold text-white sm:text-xl">{lane.title}</h3>
                  </div>
                  <a
                    href={buildWhatsAppUrl(lane.wa)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="relative z-[12] inline-flex min-h-10 shrink-0 items-center rounded-full border border-white/20 bg-black/50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-md transition hover:border-[#25D366]/60 hover:bg-[#25D366]/25"
                  >
                    WA
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
