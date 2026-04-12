"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const nav = [
  { href: "/admin/website", label: "Dashboard", icon: "◆" },
  { href: "/admin/website/products", label: "Products", icon: "▦" },
  { href: "/admin/website/categories", label: "Categories", icon: "☷" },
];

export default function WebsiteAdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-zinc-100 via-white to-zinc-50">
      <aside className="relative sticky top-0 hidden h-screen w-64 shrink-0 border-r border-black/[0.06] bg-white/80 px-4 py-8 pb-36 backdrop-blur-xl lg:block lg:overflow-hidden">
        <Link href="/admin" className="flex items-center gap-2 px-2">
          <span className="relative flex h-10 w-10 overflow-hidden rounded-xl border border-black/10">
            <Image src="/logo.png" alt="" fill className="object-contain p-1" sizes="40px" />
          </span>
          <div>
            <p className="text-sm font-semibold text-black">Website</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-black/40">
              UI preview
            </p>
          </div>
        </Link>
        <nav className="mt-10 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <motion.span
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-black text-[#FFA500]" : "text-black/65 hover:bg-black/[0.04]"
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
        <div className="absolute bottom-6 left-4 right-4 rounded-2xl border border-black/[0.06] bg-zinc-50 p-3 text-[11px] leading-relaxed text-black/45">
          This area is <strong className="text-black/70">frontend only</strong>. Use the live
          console for real edits.
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.06] bg-white/75 px-4 py-4 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/admin" className="text-sm font-semibold text-[#cc7700]">
              ← Hub
            </Link>
          </div>
          <p className="hidden text-sm text-black/45 lg:block">Website workspace · mock UI</p>
          <Link
            href="/admin/dashboard"
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-black shadow-sm transition hover:border-[#FFA500]/40"
          >
            Live admin
          </Link>
        </header>
        <div className="p-4 lg:p-10">{children}</div>
      </div>
    </div>
  );
}
