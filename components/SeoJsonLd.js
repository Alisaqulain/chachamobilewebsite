import {
  SITE_URL,
  SITE_NAME,
  BUSINESS_EMAIL,
  BUSINESS_PHONE_E164,
  PRIMARY_GEO,
  PRIMARY_ADDRESS,
  SERVICE_AREAS,
  INSTAGRAM_URL,
  WHATSAPP_UPDATES_CHANNEL_URL,
} from "@/lib/site-config";

function jsonLd(obj) {
  return JSON.stringify(obj);
}

export default function SeoJsonLd() {
  const logoUrl = `${SITE_URL}/apple-icon`;
  const sameAs = [INSTAGRAM_URL, WHATSAPP_UPDATES_CHANNEL_URL];

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: logoUrl, width: 180, height: 180 },
    image: `${SITE_URL}/opengraph-image`,
    email: BUSINESS_EMAIL,
    telephone: BUSINESS_PHONE_E164,
    sameAs,
  };

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${SITE_URL}/#localbusiness`,
    name: `${SITE_NAME} — Mobile spare parts`,
    image: `${SITE_URL}/opengraph-image`,
    url: SITE_URL,
    telephone: BUSINESS_PHONE_E164,
    email: BUSINESS_EMAIL,
    priceRange: "₹₹",
    address: PRIMARY_ADDRESS,
    geo: {
      "@type": "GeoCoordinates",
      latitude: PRIMARY_GEO.latitude,
      longitude: PRIMARY_GEO.longitude,
    },
    areaServed: SERVICE_AREAS.map((a) => ({
      "@type": a.type === "State" ? "State" : "City",
      name: a.name,
      containedInPlace: { "@type": "Country", name: "India" },
    })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:00",
        closes: "20:00",
      },
    ],
    paymentAccepted: "Cash, UPI, Bank transfer",
    currenciesAccepted: "INR",
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(localBusiness) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(website) }} />
    </>
  );
}
