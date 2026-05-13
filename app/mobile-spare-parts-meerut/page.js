import LocalCityLanding from "@/components/local/LocalCityLanding";
import { SITE_NAME } from "@/lib/site-config";

export const metadata = {
  title: `Mobile repair parts in Meerut | Display, battery & shop wholesale`,
  description: `Mobile repair parts in Meerut, Uttar Pradesh — spare parts for technicians & shops. Displays, batteries, charging. Wholesale UP. ${SITE_NAME} on WhatsApp.`,
  alternates: { canonical: "/mobile-spare-parts-meerut" },
  openGraph: {
    title: `Mobile repair parts Meerut | ${SITE_NAME}`,
    description:
      "Repair-grade spare parts for Meerut mobile markets — clear grading, WhatsApp quotes, dispatch across UP.",
    url: "/mobile-spare-parts-meerut",
  },
};

const slugPath = "/mobile-spare-parts-meerut";

export default function Page() {
  return (
    <LocalCityLanding
      cityLabel="Meerut"
      slugPath={slugPath}
      h1="Mobile repair parts in Meerut — built for busy service centres"
      introParagraphs={[
        "Meerut’s repair ecosystem runs on speed: customers want their phone back the same hour, and your bench cannot wait on vague suppliers. Chacha Mobile supplies mobile repair parts with explicit compatibility notes so your technicians spend less time on returns and more time billing labour.",
        "We serve Meerut shops sourcing for Delhi NCR spill-over demand as well as local lanes in Shastri Nagar, Abu Plaza, and surrounding markets. If you searched “mobile repair parts Meerut”, you need a partner who understands board-level variance — that is exactly how we work on WhatsApp.",
        "Send model + symptom (no boot, ghost touch, rapid drain). We recommend the right assembly tier and flag common pitfalls — for example frame glue depth, proximity flex routing, or battery BMS warnings on certain Android batches.",
      ]}
      sections={[
        {
          title: "Repair-first inventory mindset",
          body: "Unlike generic e-commerce listings, we assume you will heat, test, and fit the same day. Parts are packed to reduce flex stress, and we call out fragile corners on curved panels so your opener set does not cost you margin.",
        },
        {
          title: "Display shop economics in Meerut",
          body: "Meerut customers compare quotes street to street. We help you build a good-better-best shelf: entry glass combos, mid incell, and top OLED where demand justifies it. You get transparent per-grade pricing for repeat ordering.",
        },
        {
          title: "Logistics tuned for NCR + UP overlap",
          body: "Many Meerut wholesalers also supply Baghpat and Western UP pockets. Consolidate SKUs in one WhatsApp thread — we remember your last ten models and can pre-block incoming stock for your next weekly purchase.",
        },
      ]}
      faqs={[
        {
          q: "Can you source a part that is not listed on the website?",
          a: "Often yes for high-rotation models. Share photos of the old part and any silk-screen codes. We either stock it, suggest a cross-compatible variant, or tell you honestly if lead time is too long.",
        },
        {
          q: "Do you offer credit for established Meerut shops?",
          a: "Credit is evaluated case by case for shops with GST and steady purchase history. Start on prepaid, build rhythm, then ask our desk for account terms.",
        },
        {
          q: "How do I avoid wrong touch ID / face ID assemblies on iPhones?",
          a: "Tell us the exact model and region variant. We guide you on IC-transferred vs full assembly options where applicable, and we never promise functionality we cannot support.",
        },
        {
          q: "Is pickup available in Meerut?",
          a: "Dispatch modes change based on workload. WhatsApp us — if local pickup or rider handoff is available, we will share timing and location safely.",
        },
      ]}
    />
  );
}
