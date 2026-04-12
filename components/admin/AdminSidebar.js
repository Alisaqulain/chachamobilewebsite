"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar({ mobileOpen, onNavigate }) {
  const pathname = usePathname();

  const linkClass = (href) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
      active ? "bg-[#FFA500] text-black" : "text-white/70 hover:bg-white/10 hover:text-white"
    }`;
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-black/10 bg-zinc-950 text-white transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white">
            <Image src="/logo.png" alt="" fill className="object-contain p-0.5" sizes="40px" />
          </span>
          <div>
            <p className="text-sm font-bold tracking-tight">Chacha Mobile</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FFA500]">Admin</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          <Link href="/admin/dashboard" onClick={() => onNavigate?.()} className={linkClass("/admin/dashboard")}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </Link>
          <Link href="/admin/products" onClick={() => onNavigate?.()} className={linkClass("/admin/products")}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Products
          </Link>
          <Link href="/admin/categories" onClick={() => onNavigate?.()} className={linkClass("/admin/categories")}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Categories
          </Link>
          <Link href="/admin/brands" onClick={() => onNavigate?.()} className={linkClass("/admin/brands")}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Brands
          </Link>
          <Link href="/admin/models" onClick={() => onNavigate?.()} className={linkClass("/admin/models")}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Models
          </Link>
        </nav>

        <div className="border-t border-white/10 p-4 text-xs text-white/45">Local uploads · MongoDB</div>
      </div>
    </aside>
  );
}
