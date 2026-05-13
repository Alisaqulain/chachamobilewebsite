/** Public site + local SEO constants (India / Uttar Pradesh). */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://chachamobile.in";

export const SITE_NAME = "Chacha Mobile";

export const BUSINESS_PHONE_E164 = "+918126162661";

export const BUSINESS_EMAIL = "chachamobile8126@gmail.com";

export const INSTAGRAM_URL = "https://www.instagram.com/chacha__mobile/";

export const WHATSAPP_UPDATES_CHANNEL_URL =
  "https://whatsapp.com/channel/0029VbC7vvV3rZZmKp9mmw40";

/** Approximate centre — Muzaffarnagar (for LocalBusiness geo; refine with exact shop coordinates in GBP). */
export const PRIMARY_GEO = {
  latitude: 29.4721,
  longitude: 77.7085,
};

export const PRIMARY_ADDRESS = {
  "@type": "PostalAddress",
  addressLocality: "Muzaffarnagar",
  addressRegion: "Uttar Pradesh",
  postalCode: "251001",
  addressCountry: "IN",
};

export const SERVICE_AREAS = [
  { name: "Muzaffarnagar", type: "City" },
  { name: "Meerut", type: "City" },
  { name: "Shamli", type: "City" },
  { name: "Uttar Pradesh", type: "State" },
];
