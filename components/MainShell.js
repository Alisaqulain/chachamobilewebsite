"use client";

import { usePathname } from "next/navigation";

/**
 * Home: no top padding so the hero (full-bleed video) sits under the fixed navbar.
 * Other routes: keep offset below the navbar.
 */
export default function MainShell({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <main
      className={`flex min-h-0 flex-1 flex-col ${isHome ? "pt-0" : "pt-[4.5rem]"}`}
    >
      {children}
    </main>
  );
}
