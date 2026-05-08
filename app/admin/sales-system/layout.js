"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  { href: "/admin/sales-system/dashboard", label: "Dashboard" },
  { href: "/admin/sales-system/categories", label: "Ledger categories" },
  { href: "/admin/sales-system/suppliers", label: "Suppliers" },
  { href: "/admin/sales-system/battery-suppliers/genius", label: "Genius Batteries" },
  { href: "/admin/sales-system/sales", label: "Sales Entry" },
  { href: "/admin/sales-system/returns", label: "Returns" },
  { href: "/admin/sales-system/inventory", label: "Inventory" },
];

export default function SalesSystemLayout({ children }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const itemClass = (href) =>
    `block min-h-11 touch-manipulation rounded-xl px-3 py-3 text-sm font-semibold transition lg:min-h-0 lg:py-2.5 ${
      pathname === href || pathname.startsWith(`${href}/`)
        ? "bg-brand text-black"
        : "text-white/70 hover:bg-white/10 hover:text-white"
    }`;

  const Sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="border-b border-white/10 px-5 py-5">
        <p className="text-sm font-bold tracking-tight text-white">Sales System</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">Tally style</p>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className={itemClass(item.href)} onClick={() => setMenuOpen(false)}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-100 lg:flex">
      {menuOpen && (
        <button type="button" className="fixed inset-0 z-30 bg-black/40 lg:hidden" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
      )}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-black/10 bg-zinc-950 text-white lg:block">
        {Sidebar}
      </aside>

      {menuOpen ? (
        <aside className="fixed inset-y-0 left-0 z-40 w-[min(100%,18rem)] border-r border-black/10 bg-zinc-950 pt-[env(safe-area-inset-top,0px)] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] text-white lg:hidden">
          {Sidebar}
        </aside>
      ) : null}

      <div className="min-w-0 flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-black/10 bg-white px-4 py-3 pt-[max(0.5rem,env(safe-area-inset-top,0px))] shadow-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="touch-manipulation rounded-xl border border-black/10 bg-white p-3 lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <p className="text-sm font-semibold text-black">Sales System</p>
          </div>
          <Link
            href="/admin/website/dashboard"
            className="shrink-0 touch-manipulation rounded-lg px-2 py-2 text-xs font-semibold text-brand-dim hover:underline sm:text-sm"
          >
            Website manager
          </Link>
        </header>
        <main className="px-4 py-6 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
