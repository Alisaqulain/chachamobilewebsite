"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import TiltCard from "@/components/TiltCard";

const pillars = [
  {
    title: "Transparent grading",
    body: "Original, high copy, and economy — printed on paperwork so your customer sees what they paid for.",
  },
  {
    title: "Ops-first catalogue",
    body: "Mongo-backed SKUs you can extend anytime. Missing a part? WhatsApp us — sourcing is part of the job.",
  },
  {
    title: "WhatsApp-native sales",
    body: "No forced logins. Cart builds locally; checkout opens a pre-filled message you can edit before send.",
  },
];

const milestones = [
  { year: "Roots", text: "Bench experience turned into a focused spare-parts counter for technicians." },
  { year: "Scale", text: "Multi-brand inventory with model-level filters — built for repeat B2B orders." },
  { year: "Today", text: "Nationwide dispatch lanes, QC rituals, and a team that speaks repair language." },
];

export default function AboutPageContent() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_-10%,rgba(255,102,0,0.14),transparent)]" />
      <div className="pointer-events-none absolute right-0 top-40 h-96 w-96 rounded-full bg-accent/10 blur-[100px]" />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand">About</p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Parts desk engineered for repair professionals
          </h1>
          <p className="mt-2 text-sm font-semibold text-accent">chachamobile.in</p>
          <p className="mt-6 text-base leading-relaxed text-white/70 sm:text-lg">
            Chacha Mobile is a dedicated spare-parts supply lane — from flagship displays to charging flexes —
            with the kind of honesty and speed you expect from a partner on your shop floor, not a distant
            marketplace.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              className="h-full"
            >
              <TiltCard className="h-full">
                <div className="rounded-3xl border border-zinc-200/90 bg-white/90 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)] backdrop-blur-sm ring-1 ring-black/[0.03] transition hover:border-brand/30">
                  <h2 className="font-display text-lg font-bold text-zinc-900">{p.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">{p.body}</p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="surface-3d-hover mt-16 rounded-[2rem] border border-zinc-900 bg-zinc-900 p-8 text-white shadow-2xl sm:p-12"
        >
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand">Timeline</p>
          <ul className="mt-8 space-y-8">
            {milestones.map((m) => (
              <li key={m.year} className="flex gap-6 border-b border-white/10 pb-8 last:border-0 last:pb-0">
                <span className="font-display w-20 shrink-0 text-sm font-bold text-brand">{m.year}</span>
                <p className="text-sm leading-relaxed text-white/75 sm:text-base">{m.text}</p>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-14 flex flex-wrap gap-4"
        >
          <Link
            href="/shop"
            className="inline-flex rounded-full bg-brand px-8 py-3.5 text-sm font-bold text-black shadow-lg transition hover:bg-brand-bright"
          >
            Browse catalogue
          </Link>
          <Link
            href="/contact"
            className="inline-flex rounded-full border-2 border-white/30 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/10 hover:text-brand"
          >
            Contact us
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
