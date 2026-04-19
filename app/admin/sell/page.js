"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const orders = [];

const activity = [];

export default function SellAdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black px-4 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">
              Sell workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Orders & revenue</h1>
            <p className="mt-2 max-w-xl text-sm text-white/55">
              Premium dark dashboard shell — connect orders, payouts, and inventory later.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm font-semibold text-brand hover:underline"
          >
            ← Back to hub
          </Link>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Today’s orders", value: "0", sub: "No orders yet" },
            { label: "Pipeline value", value: "—", sub: "Connect data source" },
            { label: "Fulfilment SLA", value: "—", sub: "No baseline yet" },
          ].map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-white/45">{k.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{k.value}</p>
              <p className="mt-1 text-xs text-brand/90">{k.sub}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl lg:col-span-3"
          >
            <h2 className="text-sm font-semibold text-white">Recent orders</h2>
            <ul className="mt-4 divide-y divide-white/10">
              {orders.length === 0 ? (
                <li className="py-10 text-center text-sm text-white/45">No orders yet.</li>
              ) : (
                orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-4">
                    <div>
                      <p className="font-mono text-sm text-brand">{o.id}</p>
                      <p className="text-sm text-white/70">{o.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{o.total}</p>
                      <p className="text-xs text-white/45">{o.time}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                      {o.status}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22 }}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl lg:col-span-2"
          >
            <h2 className="text-sm font-semibold text-white">Activity</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/55">
              {activity.length === 0 ? (
                <li className="rounded-2xl border border-white/5 bg-black/20 px-4 py-8 text-center text-white/45">
                  No activity yet.
                </li>
              ) : (
                activity.map((a) => (
                  <li key={a} className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
                    {a}
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
