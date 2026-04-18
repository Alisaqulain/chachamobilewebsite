import Link from "next/link";
import SiteContentPage from "@/components/SiteContentPage";

export const metadata = {
  title: "Warranty & quality",
  description: "How Chacha Mobile stands behind spare part quality, grading, and support.",
};

export default function WarrantyPage() {
  return (
    <SiteContentPage
      kicker="Trust"
      title="Warranty & quality"
      subtitle="We label every grade honestly and support genuine issues. Details below are a summary — full legal terms live in our policies."
    >
      <div className="space-y-6 text-[15px] leading-relaxed text-zinc-600 dark:text-white/75">
        <section className="rounded-2xl border border-zinc-200/90 bg-zinc-50/90 p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">Quality grades</h2>
          <p className="mt-2">
            Products show a quality label (e.g. Original, High, Low or other admin-defined grades). That label reflects
            the tier you are purchasing — not all parts carry the same warranty scope.
          </p>
        </section>
        <section className="rounded-2xl border border-zinc-200/90 bg-zinc-50/90 p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">Dead-on-arrival & mismatch</h2>
          <p className="mt-2">
            If a part arrives damaged, non-functional out of the box, or is the wrong SKU versus what you ordered,
            contact us promptly with photos. We prioritise replacement or credit per our{" "}
            <Link href="/refund" className="font-semibold text-brand-dim underline-offset-2 hover:underline">
              returns
            </Link>{" "}
            process.
          </p>
        </section>
        <section className="rounded-2xl border border-zinc-200/90 bg-zinc-50/90 p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">Installation</h2>
          <p className="mt-2">
            Improper fitting, ESD damage, or rework by third parties may void support. When in doubt, send a short
            video on WhatsApp before heating or flexing fragile assemblies.
          </p>
        </section>
      </div>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/terms"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-semibold text-zinc-800 dark:border-white/20 dark:text-white"
        >
          Terms of service
        </Link>
        <Link
          href="/faq"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-black"
        >
          FAQ
        </Link>
      </div>
    </SiteContentPage>
  );
}
