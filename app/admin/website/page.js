"use client";

import { motion } from "framer-motion";

const stats = [
  { label: "Listed SKUs", value: "128", delta: "+12%" },
  { label: "Draft updates", value: "6", delta: "3 pending" },
  { label: "Media uploads", value: "42", delta: "This week" },
];

export default function WebsiteAdminDashboardPage() {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-black">Dashboard</h1>
        <p className="mt-1 text-sm text-black/50">
          High-level snapshot — placeholder metrics for a production-grade admin shell.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="rounded-3xl border border-black/[0.06] bg-white/90 p-6 shadow-sm backdrop-blur-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-black/40">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold text-black">{s.value}</p>
            <p className="mt-1 text-xs text-[#cc7700]">{s.delta}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.45 }}
        className="mt-10 rounded-3xl border border-dashed border-black/15 bg-zinc-50/80 p-8 text-center text-sm text-black/50"
      >
        Activity timeline and charts would render here — wired to your API when you are ready.
      </motion.div>
    </div>
  );
}
