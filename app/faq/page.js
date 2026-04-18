import Link from "next/link";
import SiteContentPage from "@/components/SiteContentPage";

export const metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Chacha Mobile spare parts, ordering, and quality grades.",
};

const faqs = [
  {
    q: "How do I place an order?",
    a: (
      <>
        Browse the{" "}
        <Link href="/shop" className="font-semibold text-brand-dim underline-offset-2 hover:underline">
          shop
        </Link>
        , add items to your cart, then complete checkout — we confirm details on{" "}
        <a
          href="https://wa.me/918126162661"
          className="font-semibold text-brand-dim underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>{" "}
        for fastest dispatch and compatibility checks.
      </>
    ),
  },
  {
    q: "What do Original, High, and Low quality mean?",
    a: "Grades describe the part tier (e.g. OEM-style vs high-copy vs economy). Each product is labelled on the site and on paperwork so you always know what you are buying.",
  },
  {
    q: "Do you ship across India?",
    a: "Yes — timelines depend on pin code and courier. See our shipping policy for estimates and packaging standards.",
  },
  {
    q: "Can shops get bulk or B2B pricing?",
    a: "Yes. Message us on WhatsApp or email with your GST and monthly volume; we will share price lists and credit terms where applicable.",
  },
  {
    q: "What if a part is incompatible?",
    a: "Contact us within the window described in our returns policy. We prioritise swaps and store credit when the issue is a genuine mismatch or defect.",
  },
];

export default function FaqPage() {
  return (
    <SiteContentPage
      kicker="Help"
      title="Frequently asked questions"
      subtitle="Quick answers about ordering, quality labels, and support. Still stuck? We reply fast on WhatsApp."
    >
      <ul className="space-y-6">
        {faqs.map((item) => (
          <li
            key={item.q}
            className="rounded-2xl border border-zinc-200/90 bg-zinc-50/90 p-5 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <p className="font-display text-base font-semibold text-zinc-900 dark:text-white">{item.q}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-600 dark:text-white/75">{item.a}</p>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/order-guide"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-black shadow-sm transition hover:bg-brand-dim"
        >
          How to order
        </Link>
        <Link
          href="/contact"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-300 bg-white px-6 text-sm font-semibold text-zinc-800 dark:border-white/20 dark:bg-transparent dark:text-white"
        >
          Contact us
        </Link>
      </div>
    </SiteContentPage>
  );
}
