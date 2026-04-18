import Link from "next/link";
import SiteContentPage from "@/components/SiteContentPage";

export const metadata = {
  title: "Services",
  description: "Chacha Mobile — spare parts supply, B2B support, and technician-focused service.",
};

const cards = [
  {
    title: "Retail & counter sales",
    body: "Single pieces and small jobs — clear labels, same-day answers on WhatsApp, and predictable grading.",
  },
  {
    title: "Shops & bulk buyers",
    body: "Model-wise lists, recurring SKUs, and dispatch planning. Ask for B2B pricing and documentation.",
  },
  {
    title: "Compatibility help",
    body: "Unsure about flex variants or regional boards? Send photos — we narrow down the right part before you buy.",
  },
];

export default function ServicesPage() {
  return (
    <SiteContentPage
      kicker="What we do"
      title="Services"
      subtitle="Parts-first supply for repair businesses — not a generic marketplace. Every listing is meant for the bench."
    >
      <div className="grid gap-4 sm:grid-cols-1">
        {cards.map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-white to-zinc-50/80 p-6 dark:border-white/10 dark:from-zinc-900/50 dark:to-zinc-950/80"
          >
            <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">{c.title}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-600 dark:text-white/75">{c.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/shop"
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-black sm:flex-none"
        >
          Browse shop
        </Link>
        <Link
          href="/contact"
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-semibold text-zinc-800 dark:border-white/20 dark:text-white sm:flex-none"
        >
          Get in touch
        </Link>
      </div>
    </SiteContentPage>
  );
}
