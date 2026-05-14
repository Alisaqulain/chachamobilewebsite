"use client";

import { usePathname } from "next/navigation";

/**
 * Home: no top padding so the hero (full-bleed video) sits under the fixed navbar.
 * Other routes: keep offset below the navbar.
 */
export default function MainShell({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAdmin = pathname.startsWith("/admin");
  /** Space for mobile/tablet conversion dock (see ConversionProvider). */
  const dockPad =
    !isAdmin ? "max-lg:pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]" : "";

  return (
    <main
      className={`flex flex-1 flex-col ${dockPad} ${
        isHome ? "pt-0" : "pt-[calc(4.5rem+env(safe-area-inset-top,0px))]"
      }`}
    >
      {children}
    </main>
  );
}
