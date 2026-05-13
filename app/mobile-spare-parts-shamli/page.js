import LocalCityLanding from "@/components/local/LocalCityLanding";
import { SITE_NAME } from "@/lib/site-config";

export const metadata = {
  title: `Mobile display shop Shamli | Spare parts, wholesale & repair stock`,
  description: `Mobile display shop in Shamli, UP — LCD/OLED, touch assemblies, batteries & small parts. Wholesale mobile spare parts for Western UP. ${SITE_NAME} WhatsApp.`,
  alternates: { canonical: "/mobile-spare-parts-shamli" },
  openGraph: {
    title: `Mobile display shop Shamli | ${SITE_NAME}`,
    description:
      "Display-focused spare parts for Shamli repair shops — grades explained, WhatsApp ordering, UP delivery.",
    url: "/mobile-spare-parts-shamli",
  },
};

const slugPath = "/mobile-spare-parts-shamli";

export default function Page() {
  return (
    <LocalCityLanding
      cityLabel="Shamli"
      slugPath={slugPath}
      h1="Mobile display shop support in Shamli — panels, touch & frame assemblies"
      introParagraphs={[
        "Shamli sits in a dense triangle of phone retail between Muzaffarnagar and Panipat traffic. Customers walk in asking for “original touch” at feature-phone prices — your display shop needs suppliers who speak honestly about grade, glue, and brightness. That is how Chacha Mobile supports Shamli counters.",
        "If you found us while searching “mobile display shop Shamli”, you probably need consistent panel supply without lottery quality. We stock fast-moving Xiaomi, Realme, Vivo, Oppo, Samsung A/M series lines and help you pick the margin-safe tier for rural walk-ins versus town premium buyers.",
        "We also back you with batteries, flex ribbons, and charging boards so you do not lose a sale when the fault is not the panel. One WhatsApp thread keeps your Shamli shop running when Sunday rush hits.",
      ]}
      sections={[
        {
          title: "Curved, incell, and budget TFT — explained in Hindi-English mix",
          body: "Your staff can explain better when they understand coating, frame colour, and sensor holes. We send short voice notes or bullet lists so your salesperson does not over-promise. That reduces post-repair debates at the counter.",
        },
        {
          title: "Wholesale cartons for Shamli distributors",
          body: "Moving ten pieces of the same model? Ask for carton pricing and mixed-grade bundles. We prioritise shops that maintain clean testing habits — fewer dead-on-arrival disputes, faster replacements when logistics squeezes a box.",
        },
        {
          title: "Nearby routing via Western UP corridors",
          body: "Shamli technicians often cover Kairana, Thanabhawan, and Muzaffarnagar rural belts. Bundle orders with neighbours to share courier cost — we help split invoices when everyone pays before dispatch.",
        },
      ]}
      faqs={[
        {
          q: "My customer broke the new display in one day — what now?",
          a: "Warranty depends on grade and installation evidence. WhatsApp clear photos before peel, after peel, and of any frame damage. We walk you through policy instead of ghosting.",
        },
        {
          q: "Can I get a brighter panel than my last supplier?",
          a: "Tell us the old SKU or share a short video under sunlight. We suggest a higher-brightness tier if stock exists, with price delta upfront.",
        },
        {
          q: "Do you help with Chinese model boards that have no box?",
          a: "Send inner board photos and IMEI sticker if available. We match by CPU + RF shield layout when model names are fake. If we are not confident, we say no — better than shipping a wrong cut.",
        },
        {
          q: "How fast can Shamli shops get parts?",
          a: "Cut-off times vary by courier. Ping us before noon for same-day dispatch attempts on in-stock SKUs; otherwise we quote the next realistic slot.",
        },
      ]}
    />
  );
}
