import Link from "next/link";
import { SITE_URL, SITE_NAME, WHATSAPP_UPDATES_CHANNEL_URL } from "@/lib/site-config";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

function JsonLd({ data }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

/**
 * @param {object} props
 * @param {string} props.cityLabel
 * @param {string} props.slugPath e.g. "/mobile-spare-parts-muzaffarnagar"
 * @param {string} props.h1
 * @param {string[]} props.introParagraphs
 * @param {{ title: string, body: string }[]} props.sections
 * @param {{ q: string, a: string }[]} props.faqs
 */
export default function LocalCityLanding({
  cityLabel,
  slugPath,
  h1,
  introParagraphs,
  sections,
  faqs,
}) {
  const pageUrl = `${SITE_URL}${slugPath}`;
  const wa = buildWhatsAppUrl(
    `Hello ${SITE_NAME}, I need mobile spare parts in ${cityLabel}, Uttar Pradesh. Please share models in stock, grade options, and price.`
  );

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: `Mobile spare parts ${cityLabel}`, item: pageUrl },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:max-w-4xl lg:px-8 lg:py-16">
      <JsonLd data={breadcrumb} />
      <JsonLd data={faqSchema} />

      <nav className="text-xs font-medium text-zinc-500 dark:text-white/45" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="text-brand-dim hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-zinc-700 dark:text-white/70">{cityLabel}</li>
        </ol>
      </nav>

      <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
        {h1}
      </h1>
      <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-brand">
        Uttar Pradesh · India · WhatsApp orders
      </p>

      <div className="mt-8 space-y-4 text-base leading-relaxed text-zinc-600 dark:text-white/75">
        {introParagraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#25D366] px-6 text-sm font-bold text-white shadow-lg transition hover:bg-[#20bd5a]"
        >
          Order on WhatsApp — {cityLabel}
        </a>
        <a
          href="tel:+918126162661"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-bold text-zinc-900 shadow-sm transition hover:border-brand/40 dark:border-white/15 dark:bg-white/10 dark:text-white"
        >
          Call +91 81261 62661
        </a>
        <a
          href={WHATSAPP_UPDATES_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 px-6 text-sm font-semibold text-zinc-800 transition hover:border-brand/30 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/85"
        >
          WhatsApp updates channel
        </a>
      </div>

      <section className="mt-14 space-y-10">
        <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
          Why shops in {cityLabel} choose us
        </h2>
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/70 sm:text-base">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-8">
        <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-white">
          Frequently asked questions
        </h2>
        <dl className="mt-6 space-y-6">
          {faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold text-zinc-900 dark:text-white">{f.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/70">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-10 text-center text-xs text-zinc-500 dark:text-white/40">
        Also serving nearby towns across Western UP. Same WhatsApp desk for Meerut, Shamli &amp; Muzaffarnagar
        clusters.
      </p>
    </div>
  );
}
