"use client";

import { usePathname } from "next/navigation";
import { BUSINESS_PHONE_E164 } from "@/lib/site-config";

export default function MobileCallFloat() {
  const pathname = usePathname() || "";
  if (pathname.startsWith("/admin")) return null;

  const digits = BUSINESS_PHONE_E164.replace(/\D/g, "");
  const telHref = `tel:+${digits}`;

  return (
    <a
      href={telHref}
      className="icon-3d-hover fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-[max(1rem,env(safe-area-inset-left,0px))] z-50 flex h-14 w-14 touch-manipulation items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg ring-4 ring-white transition hover:bg-emerald-500 hover:shadow-xl max-[380px]:h-12 max-[380px]:w-12 md:hidden"
      aria-label="Call Chacha Mobile now"
    >
      <svg className="relative z-[1] h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
    </a>
  );
}
