import Link from "next/link";
import { SITE_NAME } from "@/lib/site-config";

/**
 * Visible homepage copy for local + India intent (supports rankings; keep natural).
 */
export default function HomeLocalSeoSection() {
  return (
    <section
      className="border-t border-zinc-200 bg-zinc-50/80 py-14 dark:border-white/10 dark:bg-black/20"
      aria-labelledby="home-local-seo-heading"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2
          id="home-local-seo-heading"
          className="font-display text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl"
        >
          Mobile spare parts across Muzaffarnagar, Meerut, Shamli &amp; Uttar Pradesh
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-white/70 sm:text-base">
          {SITE_NAME} supplies repair shops, display counters, and wholesale buyers across{" "}
          <strong className="font-semibold text-zinc-800 dark:text-white/85">Western UP</strong> with
          graded displays, batteries, charging systems, cameras, speakers, and body assemblies. We are
          optimised for <strong className="font-semibold text-zinc-800 dark:text-white/85">India</strong>{" "}
          logistics and GST-friendly invoicing where applicable — not generic international dropship
          timelines.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-white/70 sm:text-base">
          Looking for{" "}
          <Link href="/mobile-spare-parts-muzaffarnagar" className="font-semibold text-brand-dim hover:underline">
            mobile spare parts in Muzaffarnagar
          </Link>
          ,{" "}
          <Link href="/mobile-spare-parts-meerut" className="font-semibold text-brand-dim hover:underline">
            mobile repair parts in Meerut
          </Link>
          , or{" "}
          <Link href="/mobile-spare-parts-shamli" className="font-semibold text-brand-dim hover:underline">
            mobile display shop stock in Shamli
          </Link>
          ? Each city page lists how we help counters quote better and reduce returns. For{" "}
          <strong className="font-semibold text-zinc-800 dark:text-white/85">
            wholesale mobile spare parts in UP
          </strong>
          , WhatsApp your model rotation — we consolidate SKUs and dispatch with clear grade labels on the
          invoice.
        </p>
        <ul className="mt-6 list-inside list-disc space-y-2 text-sm text-zinc-600 dark:text-white/65 sm:text-base">
          <li>Human WhatsApp desk for compatibility — send board photos before ordering fragile OLED jobs.</li>
          <li>Transparent quality tiers so you can match customer budget without guesswork.</li>
          <li>Delivery focused on Uttar Pradesh; we do not optimise for random overseas retail traffic.</li>
        </ul>
      </div>
    </section>
  );
}
