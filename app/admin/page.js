"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const cards = [
  {
    title: "Manage Website",
    description:
      "Public shop content manager. Maintain website products, categories, brands, and models used by the frontend catalogue.",
    href: "/admin/website/dashboard",
    cta: "Open website management",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 5a2 2 0 012-2h14a2 2 0 012 2v4H3V5zm0 6h18v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8zm4 3h4m2 0h4"
        />
      </svg>
    ),
  },
  {
    title: "Manage Sales System",
    description:
      "Internal Tally-like billing and inventory workflow. Manage parties, purchases, sales, returns, and real-time stock.",
    href: "/admin/sales-system/dashboard",
    cta: "Open sales system",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 7h16M7 3v4m10-4v4M6 11h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm2 4h4m0 0v4m0-4h4"
        />
      </svg>
    ),
  },
];

export default function AdminEntryPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-100 via-white to-zinc-50 px-4 py-16 sm:px-6 lg:py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[880px] -translate-x-1/2 rounded-full bg-brand/12 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mx-auto flex justify-center">
            <span className="relative flex h-20 w-20 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-xl">
              <Image src="/logo.png" alt="" fill className="object-contain p-2" sizes="80px" />
            </span>
          </div>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            Chacha Mobile — Control centre
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-black/55 sm:text-base">
            Choose one system. Website and Sales are fully separated in routes, navigation, and
            operational logic.
          </p>
        </motion.div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
          {cards.map((card, i) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              whileHover={{ y: -6 }}
              className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-black/[0.06] bg-white/90 p-10 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-brand shadow-lg">
                {card.icon}
              </div>
              <h2 className="relative mt-8 text-2xl font-semibold tracking-tight text-black">
                {card.title}
              </h2>
              <p className="relative mt-3 flex-1 text-sm leading-relaxed text-black/55">
                {card.description}
              </p>
              <Link
                href={card.href}
                className="relative mt-10 inline-flex items-center justify-center rounded-2xl bg-black px-8 py-4 text-sm font-semibold text-brand transition group-hover:bg-black/90"
              >
                {card.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
