"use client";

import { motion } from "framer-motion";

const perks = [
  {
    title: "Fast delivery",
    body: "Dispatch tuned for repair shops — clear ETAs and careful packing on every order.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Trusted quality",
    body: "Original, high copy, and economy grades — labelled honestly so your counter stays calm.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    title: "Best price",
    body: "Fair margins for pros — WhatsApp quotes before you commit, no surprise surcharges.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Human support",
    body: "Real humans on WhatsApp — compatibility checks, bulk pricing, and warranty clarity.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
];

export default function HomeWhyChoose() {
  return (
    <section className="relative overflow-hidden border-y border-black/[0.06] bg-white py-16 sm:py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_0%,rgba(255,165,0,0.04)_40%,transparent_70%)]" />
      <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-[#FFA500]/12 blur-[90px]" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-black/[0.04] blur-[80px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#FFA500]">Why choose us</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl">
            Built like a supply partner — not a faceless listing
          </h2>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {perks.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
              whileHover={{
                y: -10,
                boxShadow: "0 28px 60px rgba(255,165,0,0.18)",
                transition: { duration: 0.25 },
              }}
              className="relative overflow-hidden rounded-3xl border border-black/[0.07] bg-gradient-to-b from-zinc-50 to-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.35 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFA500]/20 text-[#b35c00]"
              >
                {item.icon}
              </motion.div>
              <h3 className="mt-6 text-xl font-bold text-black">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-black/60">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
