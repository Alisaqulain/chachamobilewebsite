"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WhatsAppInquiryModal from "./WhatsAppInquiryModal";
import ContactQuickModal from "./ContactQuickModal";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

const ConversionContext = createContext(null);

export function useConversion() {
  const ctx = useContext(ConversionContext);
  if (!ctx) {
    throw new Error("useConversion must be used within ConversionProvider");
  }
  return ctx;
}

function FloatingConversionUI() {
  const pathname = usePathname() || "";
  const { openInquiry, openContact } = useConversion();

  if (pathname.startsWith("/admin")) return null;

  const waHref = buildWhatsAppUrl(
    "Hello Chacha Mobile, I want mobile spare parts in UP. Please share stock and price."
  );

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-[90] border-t border-white/10 bg-zinc-950/92 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:hidden"
        aria-label="Quick actions"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-between gap-1.5">
          <Link
            href="/shop"
            className="flex min-h-[3.35rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl border border-white/10 bg-white/[0.05] py-1.5 text-[10px] font-bold uppercase tracking-wide text-white active:bg-white/10"
          >
            <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Shop
          </Link>
          <button
            type="button"
            onClick={openInquiry}
            className="flex min-h-[3.35rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl border border-brand/45 bg-brand/18 py-1.5 text-[10px] font-bold uppercase tracking-wide text-brand-bright active:bg-brand/28"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Quote
          </button>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[3.35rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl border border-[#25D366]/45 bg-[#25D366]/22 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white active:bg-[#25D366]/35"
          >
            <svg className="h-5 w-5" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
              <path d="M16.003 3c-7.18 0-13.003 5.823-13.003 13.003 0 2.296.6 4.55 1.74 6.526L3 29l6.67-1.717A12.94 12.94 0 0016.003 29C23.183 29 29 23.177 29 16.003 29 8.823 23.183 3 16.003 3zm0 23.383a10.38 10.38 0 01-5.3-1.46l-.38-.227-3.95 1.02 1.05-3.85-.25-.4a10.36 10.36 0 01-1.59-5.56c0-5.72 4.65-10.37 10.38-10.37 5.72 0 10.37 4.65 10.37 10.37 0 5.72-4.65 10.38-10.37 10.38zm5.93-7.98c-.32-.16-1.89-.93-2.18-1.04-.29-.1-.5-.16-.71.16-.21.31-.82 1.04-1 1.26-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.31.32-.52.11-.21.06-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54l-.61-.01c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.23 3.4 5.4 4.77.75.32 1.34.51 1.8.65.76.24 1.45.21 1.99.13.61-.09 1.89-.77 2.15-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37z" />
            </svg>
            WhatsApp
          </a>
          <button
            type="button"
            onClick={openContact}
            className="flex min-h-[3.35rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl border border-white/10 bg-white/[0.05] py-1.5 text-[10px] font-bold uppercase tracking-wide text-white active:bg-white/10"
          >
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Contact
          </button>
        </div>
      </nav>

      <div className="pointer-events-none fixed bottom-8 right-8 z-[90] hidden flex-col items-end gap-3 lg:flex">
        <button
          type="button"
          onClick={openInquiry}
          className="pointer-events-auto rounded-full border border-brand/45 bg-zinc-950/95 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-brand shadow-xl backdrop-blur-md transition hover:bg-brand/15"
        >
          Quick quote
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="icon-3d-hover btn-3d-pop pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl ring-4 ring-black/30"
          aria-label="Chat on WhatsApp"
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-full bg-[#25D366] opacity-35 wa-pulse-ring"
            aria-hidden
          />
          <svg className="relative z-[1] h-8 w-8" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
            <path d="M16.003 3c-7.18 0-13.003 5.823-13.003 13.003 0 2.296.6 4.55 1.74 6.526L3 29l6.67-1.717A12.94 12.94 0 0016.003 29C23.183 29 29 23.177 29 16.003 29 8.823 23.183 3 16.003 3zm0 23.383a10.38 10.38 0 01-5.3-1.46l-.38-.227-3.95 1.02 1.05-3.85-.25-.4a10.36 10.36 0 01-1.59-5.56c0-5.72 4.65-10.37 10.38-10.37 5.72 0 10.37 4.65 10.37 10.37 0 5.72-4.65 10.38-10.37 10.38zm5.93-7.98c-.32-.16-1.89-.93-2.18-1.04-.29-.1-.5-.16-.71.16-.21.31-.82 1.04-1 1.26-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.31.32-.52.11-.21.06-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54l-.61-.01c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.23 3.4 5.4 4.77.75.32 1.34.51 1.8.65.76.24 1.45.21 1.99.13.61-.09 1.89-.77 2.15-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37z" />
          </svg>
        </a>
      </div>
    </>
  );
}

export function ConversionProvider({ children }) {
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const openInquiry = useCallback(() => setInquiryOpen(true), []);
  const closeInquiry = useCallback(() => setInquiryOpen(false), []);
  const openContact = useCallback(() => setContactOpen(true), []);
  const closeContact = useCallback(() => setContactOpen(false), []);

  const value = useMemo(
    () => ({
      inquiryOpen,
      contactOpen,
      openInquiry,
      closeInquiry,
      openContact,
      closeContact,
    }),
    [inquiryOpen, contactOpen, openInquiry, closeInquiry, openContact, closeContact]
  );

  return (
    <ConversionContext.Provider value={value}>
      {children}
      <WhatsAppInquiryModal open={inquiryOpen} onClose={closeInquiry} />
      <ContactQuickModal open={contactOpen} onClose={closeContact} />
      <FloatingConversionUI />
    </ConversionContext.Provider>
  );
}
