"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const steps = [
  {
    step: "01",
    title: "Filter the catalogue",
    body: "Brand, model, category — same muscle as big marketplaces, tuned for spare parts.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Cart or WhatsApp",
    body: "Build a basket on-device, or ping us — we confirm grade, stock, and dispatch window.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Bench-ready delivery",
    body: "Protective layers, printed grading, and tracking you can share with your customer.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.25 2.25 0 00-1.227-1.307l-.137-.082M14.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m0 0h-.008v-.008H12v.008z" />
      </svg>
    ),
  },
];

export default function HomeServiceFlow() {
  return (
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-accent">How it flows</p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            From search to technician bench — without friction
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/65 sm:text-base">
            Three deliberate steps. No account walls, no mystery SKUs — just parts that land ready to fit.
          </p>
        </motion.div>

        <div className="relative mt-16 lg:mt-20">
          <div
            className="pointer-events-none absolute left-[8%] right-[8%] top-[2.75rem] hidden h-0.5 bg-gradient-to-r from-transparent via-brand/40 to-transparent lg:block"
            aria-hidden
          />
          <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="surface-3d-hover relative rounded-3xl border border-zinc-200/80 bg-white/80 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)] backdrop-blur-sm ring-1 ring-black/[0.03] transition hover:border-brand/25 hover:shadow-[0_24px_70px_rgba(255,102,0,0.12)]"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-accent/15 text-zinc-800">
                    {s.icon}
                  </span>
                  <span className="font-display text-sm font-bold tracking-widest text-brand">{s.step}</span>
                </div>
                <h3 className="font-display mt-6 text-xl font-bold text-zinc-900">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 flex justify-center"
        >
          <Link
            href="/shop"
            className="btn-3d-pop inline-flex items-center gap-2 rounded-full border-2 border-zinc-900 bg-zinc-900 px-8 py-3.5 text-sm font-bold text-brand shadow-lg transition hover:bg-zinc-800"
          >
            Open the shop
            <span aria-hidden>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
