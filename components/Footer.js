import Image from "next/image";
import Link from "next/link";
import FooterNavColumns from "@/components/FooterNavColumns";

const policies = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/shipping", label: "Shipping" },
  { href: "/refund", label: "Returns" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black text-white">
      <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-brand/15 blur-[100px]" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-brand/10 blur-[90px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 pb-[max(4rem,env(safe-area-inset-bottom,0px))] sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <span className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white shadow-lg">
                <Image
                  src="/logo.png"
                  alt="Chacha Mobile"
                  fill
                  className="object-contain p-1"
                  sizes="48px"
                />
              </span>
              <div>
                <p className="font-display text-lg font-semibold tracking-tight">Chacha Mobile</p>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
                  Premium parts
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/60">
              Displays, batteries, charging systems, cameras, and body components — curated for
              technicians and shops who care about finish and reliability.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="https://wa.me/918126162661"
                target="_blank"
                rel="noopener noreferrer"
                className="icon-3d-hover inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-[#25D366] hover:text-white"
                aria-label="WhatsApp"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              <a
                href="mailto:chachamobile8126@gmail.com"
                className="icon-3d-hover inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
                aria-label="Email"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="icon-3d-hover inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-gradient-to-br hover:from-[#f58529] hover:via-[#dd2a7b] hover:to-[#8134af] hover:text-white"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Explore
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/80">
                <li>
                  <Link href="/shop" className="transition hover:text-white">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="transition hover:text-white">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="transition hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/order-guide" className="transition hover:text-white">
                    How to order
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="transition hover:text-white">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/warranty" className="transition hover:text-white">
                    Warranty
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="transition hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <FooterNavColumns />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Policies
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/80">
                {policies.map((p) => (
                  <li key={p.href}>
                    <Link href={p.href} className="transition hover:text-white">
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Contact
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/65">
                <li>
                  <a href="tel:+918126162661" className="transition hover:text-white">
                    +91 81261 62661
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:chachamobile8126@gmail.com"
                    className="break-all transition hover:text-white"
                  >
                    chachamobile8126@gmail.com
                  </a>
                </li>
                <li>
                  <a
                    href="https://chachamobile.in"
                    className="transition hover:text-brand"
                  >
                    chachamobile.in
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 space-y-6 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-white/40 sm:flex-row">
            <p>© {new Date().getFullYear()} Chacha Mobile. All rights reserved.</p>
            <p className="text-center text-white/35 sm:text-right">
              Crafted for premium retail & repair workflows.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center sm:px-6">
            <p className="text-[11px] leading-relaxed text-white/50">
              Design &amp; development by{" "}
              <a
                href="https://devspheresolutions.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand transition hover:text-brand/90 hover:underline"
              >
                DevsSphere Solutions
              </a>
              <span className="mx-1.5 text-white/25" aria-hidden>
                ·
              </span>
              Developer: <span className="font-medium text-white/70">Syed Ali Zaidi</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
