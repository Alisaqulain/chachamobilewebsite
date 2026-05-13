import { SITE_NAME } from "@/lib/site-config";

/** PWA / install surface — uses generated `/icon` and `/apple-icon` routes. */
export default function manifest() {
  return {
    name: `${SITE_NAME} — Mobile spare parts UP`,
    short_name: SITE_NAME,
    description:
      "Mobile spare parts, displays, batteries, and repair-shop wholesale across Muzaffarnagar, Meerut, Shamli & Uttar Pradesh. Order on WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#ff6600",
    lang: "en-IN",
    dir: "ltr",
    icons: [
      { src: "/icon", type: "image/png", sizes: "32x32", purpose: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180", purpose: "any" },
    ],
  };
}
