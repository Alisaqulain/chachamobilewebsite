"use client";

import { motion, useInView } from "framer-motion";
import TiltCard from "@/components/TiltCard";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 5000, suffix: "+", label: "Live SKUs", hint: "Displays to micro-flex" },
  { value: 1200, suffix: "+", label: "Partner counters", hint: "Shops & service floors" },
  { value: 15, suffix: "+", label: "Dispatch cities", hint: "India-wide lanes" },
  { value: 98, suffix: "%", label: "QC pass rate", hint: "Bench-ready packing" },
];

function StatFigure({ value, suffix }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start;
    let frame;
    const duration = 1500;
    const tick = (ts) => {
      if (start === undefined) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const ease = 1 - (1 - t) ** 3;
      setN(Math.round(value * ease));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {n.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

export default function HomeStatsRibbon() {
  return (
    <section className="relative border-y border-white/10 bg-zinc-950 py-10 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,102,0,0.06),transparent)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-brand"
        >
          Supply lane · built for volume and repeat orders
        </motion.p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              className="h-full"
            >
              <TiltCard className="h-full">
                <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-md transition hover:border-brand/35 hover:bg-white/[0.07]">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand/20 blur-2xl transition group-hover:bg-brand/30" />
                  <p className="font-display text-3xl font-bold text-white sm:text-4xl">
                    <StatFigure value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{s.label}</p>
                  <p className="mt-1 text-xs text-white/45">{s.hint}</p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
