"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

const cities = [
  "Muzaffarnagar",
  "Meerut",
  "Shamli",
  "Other Uttar Pradesh",
  "Outside UP (B2B only)",
];

export default function WhatsAppInquiryModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Muzaffarnagar");
  const [role, setRole] = useState("Repair shop");
  const [parts, setParts] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function submit() {
    const digits = phone.replace(/\D/g, "");
    const lines = [
      "Hello Chacha Mobile — Quick quote request",
      "",
      `Name: ${name.trim() || "—"}`,
      `Phone: ${digits || "—"}`,
      `City / area: ${city}`,
      `I am a: ${role}`,
      "",
      "Parts / models needed:",
      parts.trim() || "—",
    ];
    const url = buildWhatsAppUrl(lines.join("\n"));
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close quote form"
            className="fixed inset-0 z-[200] bg-black/65 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wa-inquiry-title"
            className="fixed inset-x-4 bottom-0 top-auto z-[210] mx-auto max-h-[min(92vh,640px)] max-w-lg overflow-hidden rounded-t-3xl border border-white/15 bg-zinc-950 shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand">WhatsApp quote</p>
              <h2 id="wa-inquiry-title" className="font-display mt-1 text-xl font-bold text-white">
                Tell us what you need
              </h2>
              <p className="mt-1 text-xs text-white/55">
                We open WhatsApp with this message — you can edit before sending.
              </p>
            </div>
            <div className="max-h-[calc(min(92vh,640px)-8rem)] overflow-y-auto overscroll-contain px-5 py-4 sm:max-h-[60vh] sm:px-6">
              <label className="block text-xs font-semibold text-white/70">
                Your name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-3 text-sm text-white outline-none ring-brand/30 placeholder:text-white/30 focus:ring-2"
                  placeholder="Optional"
                  autoComplete="name"
                />
              </label>
              <label className="mt-4 block text-xs font-semibold text-white/70">
                WhatsApp number <span className="text-brand">*</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-3 text-sm text-white outline-none ring-brand/30 placeholder:text-white/30 focus:ring-2"
                  placeholder="10-digit mobile"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </label>
              <label className="mt-4 block text-xs font-semibold text-white/70">
                City / region
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                >
                  {cities.map((c) => (
                    <option key={c} value={c} className="bg-zinc-900">
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-4 block text-xs font-semibold text-white/70">
                You are a
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                >
                  {["Repair shop", "Technician", "Wholesale buyer", "Walk-in customer"].map((r) => (
                    <option key={r} value={r} className="bg-zinc-900">
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-4 block text-xs font-semibold text-white/70">
                Parts / models
                <textarea
                  value={parts}
                  onChange={(e) => setParts(e.target.value)}
                  rows={4}
                  className="mt-1.5 w-full resize-none rounded-xl border border-white/15 bg-black/40 px-3 py-3 text-sm text-white outline-none ring-brand/30 placeholder:text-white/30 focus:ring-2"
                  placeholder="e.g. Redmi Note 13 display with frame, OEM grade — qty 2"
                />
              </label>
            </div>
            <div className="flex gap-3 border-t border-white/10 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="min-h-12 flex-1 rounded-full border border-white/15 text-sm font-semibold text-white/80 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                className="min-h-12 flex-[1.35] rounded-full bg-[#25D366] text-sm font-bold text-white shadow-lg transition hover:bg-[#20bd5a] active:scale-[0.99]"
              >
                Open WhatsApp
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
