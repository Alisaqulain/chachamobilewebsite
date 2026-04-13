"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const MAP_EMBED =
  "https://www.google.com/maps?q=29.4693871,77.6959763&z=17&hl=en&output=embed";

export default function ContactPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,102,0,0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px]" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand">Contact</p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Let’s talk parts
          </h1>
          <p className="mt-5 text-base leading-relaxed text-white/70 sm:text-lg">
            Call, email, or WhatsApp — fast answers on availability, compatible SKUs, and bulk pricing.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Avg. reply under 10 min", "B2B bulk quotes", "Same-day dispatch zones"].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-zinc-200 bg-white/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 shadow-sm backdrop-blur-sm"
              >
                {chip}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="space-y-6"
          >
            {[
              { label: "Phone", val: "+91 81261 62661", href: "tel:+918126162661" },
              {
                label: "WhatsApp",
                val: "+91 81261 62661",
                href: "https://wa.me/918126162661",
                external: true,
              },
              {
                label: "Email",
                val: "chachamobile8126@gmail.com",
                href: "mailto:chachamobile8126@gmail.com",
              },
            ].map((row) => (
              <a
                key={row.label}
                href={row.href}
                target={row.external ? "_blank" : undefined}
                rel={row.external ? "noopener noreferrer" : undefined}
                className="card-gradient-border surface-3d-hover block rounded-3xl bg-white/90 p-6 shadow-[0_12px_48px_rgba(0,0,0,0.07)] backdrop-blur-xl transition hover:shadow-xl"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                  {row.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-black">{row.val}</p>
              </a>
            ))}
            <div className="surface-3d-hover rounded-3xl border border-black/[0.06] bg-white/80 p-6 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Address
              </p>
              <p className="mt-2 text-sm leading-relaxed text-black/65">
                Chacha Mobile — India. Open the map for exact directions.
              </p>
              <a
                href="https://maps.app.goo.gl/9GFzaknT5fP1aWAh9"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-2xl bg-black px-5 py-2.5 text-xs font-semibold text-brand"
              >
                Open in Google Maps
              </a>
            </div>
            <Link
              href="/shop"
              className="inline-flex rounded-2xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-brand/50"
            >
              ← Back to shop
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="overflow-hidden rounded-[2rem] border border-black/[0.06] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.08)]"
          >
            <iframe
              title="Chacha Mobile on Google Maps"
              src={MAP_EMBED}
              width="100%"
              height="100%"
              className="min-h-[400px] w-full lg:min-h-full"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          className="mt-12 flex justify-center"
        >
          <a
            href="https://wa.me/918126162661"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-3d-pop inline-flex items-center gap-2 rounded-full bg-[#25D366] px-10 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-[#1ebe5d]"
          >
            Message on WhatsApp
          </a>
        </motion.div>
      </div>
    </div>
  );
}
