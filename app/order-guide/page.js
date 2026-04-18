import Link from "next/link";
import SiteContentPage from "@/components/SiteContentPage";

export const metadata = {
  title: "How to order",
  description: "Step-by-step guide to ordering mobile spare parts from Chacha Mobile — shop, cart, and WhatsApp.",
};

const steps = [
  {
    n: "1",
    title: "Find your part",
    body: "Use Shop, category shortcuts, or search by model name. Check the quality badge and photos before adding to cart.",
  },
  {
    n: "2",
    title: "Review your cart",
    body: "Adjust quantities and note any compatibility questions in your WhatsApp message so we can double-check before dispatch.",
  },
  {
    n: "3",
    title: "Message on WhatsApp",
    body: "After checkout intent, ping us on WhatsApp with your cart summary. We confirm stock, compatible variants, and delivery options.",
  },
  {
    n: "4",
    title: "Pay & dispatch",
    body: "We share payment details and tracking once confirmed. Bulk and shop accounts can request invoicing on WhatsApp.",
  },
];

export default function OrderGuidePage() {
  return (
    <SiteContentPage
      kicker="Guide"
      title="How to order"
      subtitle="A simple flow built for technicians and shop counters — fast replies, clear SKUs, no guesswork."
    >
      <ol className="space-y-4">
        {steps.map((s) => (
          <li
            key={s.n}
            className="flex gap-4 rounded-2xl border border-zinc-200/90 bg-white/90 p-5 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-black text-black">
              {s.n}
            </span>
            <div>
              <p className="font-display font-semibold text-zinc-900 dark:text-white">{s.title}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-zinc-600 dark:text-white/75">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-10 rounded-2xl border border-brand/25 bg-brand/10 p-6 dark:bg-brand/15">
        <p className="font-display text-lg font-semibold text-zinc-900 dark:text-white">Prefer voice or photos?</p>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-700 dark:text-white/80">
          Send board photos or part numbers on WhatsApp — we match compatible SKUs from inventory.
        </p>
        <a
          href="https://wa.me/918126162661"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-full bg-[#25D366] px-6 text-sm font-bold text-white shadow-md"
        >
          Open WhatsApp
        </a>
      </div>
      <p className="mt-8 text-sm text-zinc-500 dark:text-white/50">
        <Link href="/faq" className="font-semibold text-brand-dim hover:underline">
          Read the FAQ
        </Link>{" "}
        or{" "}
        <Link href="/warranty" className="font-semibold text-brand-dim hover:underline">
          warranty overview
        </Link>
        .
      </p>
    </SiteContentPage>
  );
}
