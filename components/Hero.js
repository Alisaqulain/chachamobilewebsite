import Link from "next/link";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

export default function Hero() {
  const wa = buildWhatsAppUrl(
    "Hello Chacha Mobile, I need help with mobile spare parts / repair."
  );

  return (
    <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-[#FFA500] via-[#ffb733] to-[#ff8c00] p-8 text-black shadow-xl md:p-12">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
      <div className="relative max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-black/70">
          Chacha Mobile · chachamobile.in
        </p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">
          Mobile repair & genuine spare parts
        </h1>
        <p className="mt-4 text-base font-medium text-black/80 md:text-lg">
          Displays, batteries, charging ports, body folders, speakers, cameras — browse the shop
          and order instantly on WhatsApp.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-bold text-[#FFA500] shadow-lg transition hover:bg-black/90"
          >
            Browse shop
          </Link>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border-2 border-black bg-white/90 px-6 py-3 text-sm font-bold text-black transition hover:bg-white"
          >
            Order on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
