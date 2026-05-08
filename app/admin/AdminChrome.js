"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminChrome({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const isPublicAdmin =
    pathname === "/admin" ||
    pathname.startsWith("/admin/website") ||
    pathname.startsWith("/admin/sell");
  const isStaffPanel =
    pathname.startsWith("/admin/dashboard") ||
    pathname.startsWith("/admin/products") ||
    pathname.startsWith("/admin/categories") ||
    pathname.startsWith("/admin/brands") ||
    pathname.startsWith("/admin/models") ||
    pathname.startsWith("/admin/suppliers") ||
    pathname.startsWith("/admin/customers") ||
    pathname.startsWith("/admin/purchases") ||
    pathname.startsWith("/admin/sales") ||
    pathname.startsWith("/admin/returns") ||
    pathname.startsWith("/admin/inventory") ||
    pathname.startsWith("/admin/sales-system");

  const [state, setState] = useState({
    loading: isStaffPanel && !isLogin,
    ok: !isStaffPanel || isLogin,
    email: "",
  });
  const [menuOpen, setMenuOpen] = useState(false);

  const check = useCallback(async () => {
    if (!isStaffPanel || isLogin) return;
    try {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        const data = await res.json();
        setState({ loading: false, ok: true, email: data.admin?.email || "" });
      } else {
        setState({ loading: false, ok: false, email: "" });
        router.replace("/admin/login");
      }
    } catch {
      setState({ loading: false, ok: false, email: "" });
      router.replace("/admin/login");
    }
  }, [isStaffPanel, isLogin, router]);

  useEffect(() => {
    startTransition(() => {
      void check();
    });
  }, [check]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  if (isLogin) {
    return <div className="min-h-screen bg-zinc-100">{children}</div>;
  }

  if (isPublicAdmin) {
    return <div className="min-h-screen bg-zinc-50">{children}</div>;
  }

  if (!isStaffPanel) {
    return <>{children}</>;
  }

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 text-sm text-black/60">
        Checking session…
      </div>
    );
  }

  if (!state.ok) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-100 lg:flex">
      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <AdminSidebar mobileOpen={menuOpen} onNavigate={() => setMenuOpen(false)} />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] shadow-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="touch-manipulation rounded-xl border border-black/10 bg-white p-3 lg:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/admin" className="hidden items-center gap-2 sm:flex">
              <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white">
                <Image src="/logo.png" alt="" fill className="object-contain p-0.5" sizes="32px" />
              </span>
              <span className="text-sm font-bold text-black">
                Back office <span className="text-brand">console</span>
              </span>
            </Link>
          </div>
          <div className="flex max-w-full flex-wrap items-center justify-end gap-2 text-sm sm:gap-3">
            <span className="hidden max-w-[12rem] truncate text-black/55 md:inline">{state.email}</span>
            <Link
              href="/admin"
              className="inline-flex min-h-10 touch-manipulation items-center justify-center rounded-lg px-2 font-semibold text-black/50 hover:text-black"
            >
              Hub
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-10 touch-manipulation items-center font-semibold text-brand-dim hover:underline"
            >
              View site
            </Link>
            <button
              type="button"
              onClick={logout}
              className="touch-manipulation rounded-full bg-black px-4 py-2 text-xs font-bold text-brand active:opacity-90"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
