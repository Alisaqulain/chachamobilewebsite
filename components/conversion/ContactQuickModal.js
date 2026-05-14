"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { BUSINESS_EMAIL, INSTAGRAM_URL, SITE_NAME, WHATSAPP_UPDATES_CHANNEL_URL } from "@/lib/site-config";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

export default function ContactQuickModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted) return null;

  const wa = buildWhatsAppUrl(
    `Hello ${SITE_NAME}, I need help with an order or spare part compatibility.`
  );

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close contact"
            className="fixed inset-0 z-[200] bg-black/65 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-quick-title"
            className="fixed inset-x-4 top-[max(4rem,8vh)] z-[210] mx-auto max-w-md rounded-3xl border border-white/12 bg-zinc-950 p-6 shadow-2xl sm:p-8"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h2 id="contact-quick-title" className="font-display text-xl font-bold text-white">
              Contact {SITE_NAME}
            </h2>
            <p className="mt-2 text-sm text-white/60">Fastest response on WhatsApp — we reply in minutes during business hours.</p>
            <ul className="mt-6 space-y-3 text-sm">
              <li>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 items-center justify-center rounded-2xl bg-[#25D366] font-bold text-white transition hover:bg-[#20bd5a]"
                >
                  WhatsApp desk
                </a>
              </li>
              <li>
                <a
                  href="tel:+918126162661"
                  className="flex min-h-12 items-center justify-center rounded-2xl border border-white/15 font-semibold text-white transition hover:bg-white/5"
                >
                  Call +91 81261 62661
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${BUSINESS_EMAIL}`}
                  className="flex min-h-12 items-center justify-center rounded-2xl border border-white/15 font-semibold text-white/90 transition hover:bg-white/5"
                >
                  Email
                </a>
              </li>
              <li>
                <Link
                  href="/contact"
                  onClick={onClose}
                  className="flex min-h-12 items-center justify-center rounded-2xl border border-brand/35 font-semibold text-brand transition hover:bg-brand/10"
                >
                  Full contact page
                </Link>
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-5">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 hover:border-brand/40"
              >
                Instagram
              </a>
              <a
                href={WHATSAPP_UPDATES_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 hover:border-brand/40"
              >
                Updates channel
              </a>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-full border border-white/10 py-3 text-sm font-semibold text-white/70 hover:bg-white/5"
            >
              Close
            </button>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
