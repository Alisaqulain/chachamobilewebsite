"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const cards = [
  {
    title: "Wholesale rhythm",
    body: "Mixed grades, carton pricing, and repeat SKU memory — built for counters that move volume across Western UP.",
    icon: "◇",
  },
  {
    title: "Dispatch you can plan",
    body: "Clear cut-offs and honest ETAs. We do not promise magic couriers — we promise straight answers on WhatsApp.",
    icon: "⏱",
  },
  {
    title: "Technician-first support",
    body: "Board photos before you heat the shield. Compatibility notes that survive a busy Sunday rush at the bench.",
    icon: "◎",
  },
];

export default function HomeTrustDelivery() {
  return (
    <section className="relative border-y border-white/10 bg-zinc-950 py-16 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,102,0,0.06),transparent_40%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand">Trust · speed · clarity</p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for repair floors, not impulse scrollers
          </h2>
          <p className="mt-4 text-sm text-white/60 sm:text-base">
            Same-day mindset with paperwork that matches what you sold — grades on invoice, humans on chat.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-inner shadow-black/40"
            >
              <span className="text-2xl text-brand" aria-hidden>
                {c.icon}
              </span>
              <h3 className="font-display mt-3 text-lg font-bold text-white">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{c.body}</p>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <Link
            href="/order-guide"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-brand/40 px-6 text-sm font-bold text-brand transition hover:bg-brand/10"
          >
            See how ordering works
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
