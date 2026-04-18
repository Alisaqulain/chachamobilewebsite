"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const nav = [
  { href: "/admin/website/dashboard", label: "Dashboard", icon: "◆" },
  { href: "/admin/website/products", label: "Products", icon: "▦" },
  { href: "/admin/website/categories", label: "Categories", icon: "☷" },
  { href: "/admin/website/brands", label: "Brands", icon: "◈" },
  { href: "/admin/website/models", label: "Models", icon: "▤" },
];

function SidebarNav({ pathname, onNavigate }) {
  return (
    <>
      <Link href="/admin" className="flex items-center gap-2 px-2" onClick={() => onNavigate?.()}>
        <span className="relative flex h-10 w-10 overflow-hidden rounded-xl border border-black/10">
          <Image src="/logo.png" alt="" fill className="object-contain p-1" sizes="40px" />
        </span>
        <div>
          <p className="text-sm font-semibold text-black">Website</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-black/40">
            Public shop manager
          </p>
        </div>
      </Link>
      <nav className="mt-10 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="block" onClick={() => onNavigate?.()}>
              <motion.span
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-black text-brand" : "text-black/65 hover:bg-black/[0.04]"
                }`}
                whileHover={{ x: 2 }}
              >
                <span className="text-xs opacity-60">{item.icon}</span>
                {item.label}
              </motion.span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-black/[0.06] bg-zinc-50 p-3 text-[11px] leading-relaxed text-black/45 lg:absolute lg:bottom-6 lg:left-4 lg:right-4 lg:mt-0">
        Only website catalogue configuration lives here. Sales vouchers and stock movement stay in
        the separate sales system.
      </div>
    </>
  );
}

export default function WebsiteAdminLayout({ children }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-zinc-100 via-white to-zinc-50">
      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-black/[0.06] bg-white/80 px-4 py-8 pb-36 backdrop-blur-xl lg:flex lg:flex-col lg:overflow-hidden">
        <SidebarNav pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[min(100%,18rem)] flex-col border-r border-black/[0.06] bg-white px-4 py-8 shadow-2xl lg:hidden"
            style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <SidebarNav pathname={pathname} onNavigate={() => setMenuOpen(false)} />
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-black/[0.06] bg-white/75 px-4 py-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] backdrop-blur-xl lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="touch-manipulation rounded-xl border border-black/10 bg-white p-3 shadow-sm lg:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <Link href="/admin" className="truncate text-sm font-semibold text-brand-dim lg:hidden">
              ← Hub
            </Link>
          </div>
          <p className="hidden text-sm text-black/45 lg:block">Website management · public shop data</p>
          <Link
            href="/admin/sales-system/dashboard"
            className="shrink-0 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-black shadow-sm transition hover:border-brand/40"
          >
            Sales system
          </Link>
        </header>
        <div className="p-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] lg:p-10">{children}</div>
      </div>
    </div>
  );
}
