"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    q: "Do you ship across Uttar Pradesh only?",
    a: "We optimise routes and stock for Western UP clusters (Muzaffarnagar, Meerut, Shamli and nearby). Other states may be possible for established B2B — ask on WhatsApp with your GST and pin code.",
  },
  {
    q: "How do I know which display grade to sell?",
    a: "We label grades clearly and explain brightness, frame, and touch coating differences. Send your customer budget and we suggest the margin-safe tier.",
  },
  {
    q: "Can I return a dead-on-arrival part?",
    a: "Policy depends on grade and whether the flex was peeled. WhatsApp photos before installation — we guide you through DOA steps fast.",
  },
  {
    q: "Do you offer credit to shops?",
    a: "Evaluated case-by-case for GST shops with purchase history. Most accounts start prepaid, then graduate to terms.",
  },
  {
    q: "Is the website cart a real checkout?",
    a: "The cart builds a clean WhatsApp message with SKUs and quantities — you confirm price and dispatch with our desk.",
  },
];

export default function HomeFaqAccordion() {
  const [open, setOpen] = useState(null);

  return (
    <section className="relative py-16 sm:py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(255,102,0,0.1),transparent)]" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.3em] text-brand">FAQ</p>
        <h2 className="font-display mt-3 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Answers before you ping us
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white/60">
          Still unsure? The quote form opens WhatsApp with context filled in.
        </p>
        <ul className="mt-10 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <li
                key={item.q}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-white sm:text-base">{item.q}</span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-brand transition ${
                      isOpen ? "rotate-180 bg-brand/15" : ""
                    }`}
                    aria-hidden
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="border-t border-white/10 px-5 pb-4 pt-3 text-sm leading-relaxed text-white/65">
                        {item.a}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
