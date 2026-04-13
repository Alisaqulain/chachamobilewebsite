"use client";

import { buildWhatsAppUrl } from "@/utils/whatsapp";

export default function WhatsAppFloat() {
  const href = buildWhatsAppUrl(
    "Hello Chacha Mobile, I would like to know more about your spare parts."
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="icon-3d-hover btn-3d-pop fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-4 ring-white transition hover:shadow-xl sm:bottom-6 sm:right-6"
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
  );
}
