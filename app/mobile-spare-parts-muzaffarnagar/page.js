import LocalCityLanding from "@/components/local/LocalCityLanding";
import { SITE_NAME } from "@/lib/site-config";

export const metadata = {
  title: `Mobile spare parts in Muzaffarnagar | LCD, battery & wholesale`,
  description: `Mobile spare parts in Muzaffarnagar, Uttar Pradesh — displays, batteries, charging ports, wholesale for repair shops. Order on WhatsApp. ${SITE_NAME}.`,
  alternates: { canonical: "/mobile-spare-parts-muzaffarnagar" },
  openGraph: {
    title: `Mobile spare parts Muzaffarnagar | ${SITE_NAME}`,
    description:
      "LCD / OLED displays, batteries, flex & small parts for repair shops in Muzaffarnagar & nearby UP. WhatsApp ordering.",
    url: "/mobile-spare-parts-muzaffarnagar",
  },
};

const slugPath = "/mobile-spare-parts-muzaffarnagar";

export default function Page() {
  return (
    <LocalCityLanding
      cityLabel="Muzaffarnagar"
      slugPath={slugPath}
      h1="Mobile spare parts in Muzaffarnagar — displays, batteries & repair stock"
      introParagraphs={[
        "If you run a repair counter or mobile shop in Muzaffarnagar, you already know how fast display and battery demand moves. Chacha Mobile stocks curated mobile spare parts with clear quality grades so you can quote confidently and close the job without callbacks.",
        "We focus on Western Uttar Pradesh — same-day answers on WhatsApp, compatibility checks for tricky boards, and wholesale-friendly lines for shops that move volume. Search “mobile spare parts in Muzaffarnagar” and you will land here: real humans, not a faceless marketplace.",
        "Whether you need a single premium OLED or a mixed carton for budget repairs, message us with model name, colour, and frame type. We confirm stock, share photos where needed, and dispatch with predictable grading printed on your paperwork.",
      ]}
      sections={[
        {
          title: "Display & touch solutions for Muzaffarnagar counters",
          body: "From budget TFT assemblies to higher-grade incell and OLED options, we help you match customer expectations to margin. Tell us the exact model — for example Samsung A-series frame variants or iPhone panel generations — and we shortlist compatible SKUs so you do not lose time guessing.",
        },
        {
          title: "Batteries, charging flex, and small parts that complete the repair",
          body: "A display job often needs a charging PCB, battery adhesive kit, or earpiece mesh. We bundle suggestions when you share a board photo so your technician leaves the bench once. Ideal for busy lanes near Budhana Road, Civil Lines, and industrial belt walk-ins.",
        },
        {
          title: "Wholesale rhythm for UP repair clusters",
          body: "Shops in Muzaffarnagar often supply technicians in Shamli and Meerut corridors. Our WhatsApp desk understands B2B: repeat SKUs, mixed grades, and priority dispatch when your counter is empty. Ask for a wholesale price list for the models you sell every week.",
        },
      ]}
      faqs={[
        {
          q: "Do you deliver mobile spare parts in Muzaffarnagar same day?",
          a: "Dispatch depends on stock and courier cut-off. Message on WhatsApp with your pin code and part list — we give an honest timeline. Many Western UP routes move quickly once payment is confirmed.",
        },
        {
          q: "Can I match a display grade to my customer budget?",
          a: "Yes. We label grades clearly (for example economy vs premium) and explain differences in colour, brightness, and touch coating so you can upsell or save margin without surprises.",
        },
        {
          q: "I am a technician, not a shop. Can I still order?",
          a: "Absolutely. Many freelancers order single pieces with full compatibility checks. Send board photos before heating the shield — we help you avoid wrong flex versions.",
        },
        {
          q: "Do you stock iPhone and Android parts for Muzaffarnagar demand?",
          a: "We carry fast-moving Android lines and selective iPhone SKUs. WhatsApp your top ten models and we will confirm what is in stock or arriving next.",
        },
      ]}
    />
  );
}
