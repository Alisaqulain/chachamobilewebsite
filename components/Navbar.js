"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState, startTransition, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useCart } from "./CartProvider";
import { useShopCategories } from "@/hooks/useShopCategories";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const { totalQty } = useCart();
  const navCategories = useShopCategories();
  const [mounted, setMounted] = useState(false);
  const [mega, setMega] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const closeTimer = useRef(null);

  const SCROLL_THRESHOLD = 12;

  /** Must use ?? not || — scrollY === 0 is valid at page top; || would skip 0 and use a non-zero scrollTop by mistake. */
  function readScrollY() {
    if (typeof window === "undefined") return 0;
    const w = window.scrollY;
    if (Number.isFinite(w)) return w;
    const p = window.pageYOffset;
    if (Number.isFinite(p)) return p;
    const doc = document.documentElement?.scrollTop;
    if (Number.isFinite(doc)) return doc;
    const body = document.body?.scrollTop;
    return Number.isFinite(body) ? body : 0;
  }

  useLayoutEffect(() => {
    setScrolled(readScrollY() > SCROLL_THRESHOLD);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(readScrollY() > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  const openMega = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMega(true);
  }, []);

  const scheduleCloseMega = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMega(false), 160);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    router.push(`/shop?search=${encodeURIComponent(term)}`);
    setSearchOpen(false);
    setQ("");
  };

  const navIdle = scrolled
    ? "text-black/65 hover:bg-black/[0.04]"
    : "text-white/88 hover:bg-white/12";
  const brandTitle = scrolled ? "text-black" : "text-white";
  const brandSub = scrolled ? "text-black/38" : "text-white/45";
  const iconShell = scrolled
    ? "border-black/[0.08] bg-white/80 text-black/70 shadow-sm hover:border-brand/40 hover:text-black"
    : "border-white/25 bg-white/10 text-white shadow-none backdrop-blur-md hover:border-brand/45 hover:bg-white/15";

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-[100] w-full border-b transition-[background-color,box-shadow,backdrop-filter,border-color] duration-500 ${
        scrolled
          ? "border-black/[0.06] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl"
          : "border-transparent shadow-none backdrop-blur-none bg-transparent"
      }`}
      style={
        scrolled
          ? undefined
          : {
              backgroundColor: "transparent",
              boxShadow: "none",
              backdropFilter: "none",
              WebkitBackdropFilter: "none",
            }
      }
    >
      <div
        className={`pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/70 to-transparent transition-opacity duration-500 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <span
            className={`icon-3d-hover relative flex h-11 w-11 shrink-0 overflow-hidden rounded-2xl border bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition duration-300 group-hover:shadow-[0_8px_32px_rgba(255,165,0,0.28)] ${
              scrolled ? "border-black/[0.06] ring-1 ring-black/[0.04]" : "border-white/25 ring-1 ring-white/15"
            }`}
          >
            <Image
              src="/logo.png"
              alt="Chacha Mobile"
              fill
              className="object-contain p-1"
              sizes="44px"
              priority
            />
          </span>
          <div className="hidden leading-tight sm:block">
            <span
              className={`font-display block text-[0.95rem] font-semibold tracking-tight transition-colors duration-500 ${brandTitle}`}
            >
              Chacha Mobile
            </span>
            <span
              className={`text-[10px] font-medium uppercase tracking-[0.2em] transition-colors duration-500 ${brandSub}`}
            >
              Premium parts
            </span>
          </div>
        </Link>

        <nav className="mx-auto hidden h-full flex-1 items-center justify-center gap-1 lg:flex">
          <Link
            href="/"
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-500 ${
              pathname === "/" ? "bg-black text-brand" : navIdle
            }`}
          >
            Home
          </Link>
          <Link
            href="/shop"
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-500 ${
              pathname === "/shop" ? "bg-black text-brand" : navIdle
            }`}
          >
            Shop
          </Link>

          <div
            className="relative"
            onMouseEnter={openMega}
            onMouseLeave={scheduleCloseMega}
          >
            <button
              type="button"
              className={`nav-pill-3d flex items-center gap-1 rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-500 ${
                mega ? "bg-black text-brand" : navIdle
              }`}
              aria-expanded={mega}
              aria-haspopup="true"
            >
              Categories
              <svg className="h-3.5 w-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {mega && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-1/2 top-full z-[120] mt-3 w-[min(920px,calc(100vw-2rem))] -translate-x-1/2"
                  onMouseEnter={openMega}
                  onMouseLeave={scheduleCloseMega}
                >
                  <div className="rounded-3xl border border-white/10 bg-black/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/5 backdrop-blur-2xl">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                      {navCategories.map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                          className="surface-3d-hover group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/80 p-3 transition hover:border-brand/50 hover:bg-zinc-900 hover:shadow-[0_12px_36px_rgba(255,102,0,0.2)]"
                        >
                          <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-zinc-800">
                            <Image
                              src={cat.image}
                              alt=""
                              fill
                              className="object-cover transition duration-500 group-hover:scale-110"
                              sizes="140px"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-70" />
                            <span className="absolute left-2 top-2 text-lg text-white drop-shadow">
                              {cat.icon}
                            </span>
                          </div>
                          <p className="text-xs font-semibold leading-snug text-white">{cat.label}</p>
                          <p className="mt-0.5 text-[10px] text-white/50">{cat.blurb}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/contact"
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-500 ${
              pathname === "/contact" ? "bg-black text-brand" : navIdle
            }`}
          >
            Contact
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <AnimatePresence mode="wait">
            {searchOpen ? (
              <motion.form
                key="search"
                initial={{ width: 40, opacity: 0.8 }}
                animate={{ width: 220, opacity: 1 }}
                exit={{ width: 40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                onSubmit={onSearch}
                className="hidden overflow-hidden rounded-2xl border border-black/10 bg-white/90 shadow-sm sm:flex"
              >
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search…"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-black/35"
                />
                <button
                  type="submit"
                  className="shrink-0 px-3 text-xs font-semibold text-brand-dim"
                >
                  Go
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="px-2 text-black/40 hover:text-black"
                  aria-label="Close search"
                >
                  ×
                </button>
              </motion.form>
            ) : (
              <motion.button
                key="icon"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSearchOpen(true)}
                className={`icon-3d-hover hidden h-11 w-11 items-center justify-center rounded-2xl border transition-colors duration-500 sm:flex ${iconShell}`}
                aria-label="Search"
              >
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          <Link
            href="/cart"
            className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors duration-500 sm:w-auto sm:gap-2 sm:px-4 ${iconShell}`}
          >
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="hidden text-sm font-semibold sm:inline">Cart</span>
            {mounted && totalQty > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-black shadow">
                {totalQty}
              </span>
            )}
          </Link>

          <a
            href="https://wa.me/918126162661"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-3d-pop flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-md transition hover:shadow-lg"
            aria-label="WhatsApp"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>

          <details className="relative lg:hidden">
            <summary
              className={`flex h-11 list-none items-center justify-center rounded-2xl border px-3 transition-colors duration-500 [&::-webkit-details-marker]:hidden ${iconShell}`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </summary>
            <div className="absolute right-0 z-[130] mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-black/95 py-2 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
              <Link href="/" className="block px-4 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10">
                Home
              </Link>
              <Link href="/shop" className="block px-4 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10">
                Shop
              </Link>
              <div className="border-t border-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/45">
                Categories
              </div>
              {navCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/shop?category=${encodeURIComponent(c.slug)}`}
                  className="block px-4 py-2 text-sm text-white/75 hover:bg-white/10"
                >
                  {c.label}
                </Link>
              ))}
              <Link href="/contact" className="block border-t border-white/10 px-4 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10">
                Contact
              </Link>
              <form
                onSubmit={onSearch}
                className="border-t border-white/10 p-3"
              >
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search shop…"
                  className="w-full rounded-xl border border-white/15 bg-zinc-900/80 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-brand/50"
                />
              </form>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
