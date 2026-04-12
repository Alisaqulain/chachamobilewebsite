"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const cards = [
  {
    title: "Maintain Website",
    description: "Manage products, categories, and catalogue content connected to your database.",
    href: "/admin/website",
    cta: "Open dashboard",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    title: "Maintain Sell",
    description: "Selling workspace for orders, fulfilment, and inventory (UI preview — future).",
    href: "/admin/sell",
    cta: "Open sell panel",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
];

export default function AdminEntryPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-100 via-white to-zinc-50 px-4 py-16 sm:px-6 lg:py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[880px] -translate-x-1/2 rounded-full bg-[#FFA500]/12 blur-[120px]" />

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
          <p className="mx-auto mt-3 max-w-lg text-sm text-black/55 sm:text-base">
            Choose a workspace. Website tools connect to your live admin console; Sell is a
            premium UI shell for what comes next.
          </p>
          <Link
            href="/admin/login"
            className="mt-6 inline-block text-sm font-semibold text-[#cc7700] hover:underline"
          >
            Staff login → catalogue admin
          </Link>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {cards.map((card, i) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              whileHover={{ y: -6 }}
              className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-black/[0.06] bg-white/90 p-10 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFA500]/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-[#FFA500] shadow-lg">
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
                className="relative mt-10 inline-flex items-center justify-center rounded-2xl bg-black px-8 py-4 text-sm font-semibold text-[#FFA500] transition group-hover:bg-black/90"
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
