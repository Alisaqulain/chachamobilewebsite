import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import Navbar from "@/components/Navbar";
import MainShell from "@/components/MainShell";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import MobileCallFloat from "@/components/MobileCallFloat";
import ScrollToTop from "@/components/ScrollToTop";
import SeoJsonLd from "@/components/SeoJsonLd";
import {
  SITE_URL,
  SITE_NAME,
  PRIMARY_GEO,
} from "@/lib/site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

const defaultDescription =
  "Mobile spare parts in Muzaffarnagar, Meerut, Shamli & across Uttar Pradesh — displays, batteries, charging ports, wholesale for repair shops. Order on WhatsApp. India-focused delivery.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `Mobile Spare Parts Muzaffarnagar, Meerut, Shamli | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: defaultDescription,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "electronics",
  keywords: [
    "mobile spare parts Muzaffarnagar",
    "mobile repair parts Meerut",
    "mobile display shop Shamli",
    "wholesale mobile spare parts UP",
    "mobile spare parts Uttar Pradesh",
    "LCD display wholesale India",
    "mobile parts supplier UP",
  ],
  alternates: {
    canonical: "./",
    languages: { "en-IN": "./" },
  },
  openGraph: {
    title: `${SITE_NAME} | Mobile spare parts UP`,
    description: defaultDescription,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — mobile spare parts in Uttar Pradesh`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Mobile spare parts UP`,
    description: defaultDescription,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "32x32" },
      { url: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  other: {
    "geo.region": "IN-UP",
    "geo.placename": "Muzaffarnagar",
    "geo.position": `${PRIMARY_GEO.latitude};${PRIMARY_GEO.longitude}`,
    ICBM: `${PRIMARY_GEO.latitude}, ${PRIMARY_GEO.longitude}`,
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en-IN"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full`}
    >
      <body className="app-site-shell flex min-h-dvh flex-col antialiased">
        <SeoJsonLd />
        <CartProvider>
          <Navbar />
          <MainShell>{children}</MainShell>
          <Footer />
          <WhatsAppFloat />
          <MobileCallFloat />
          <ScrollToTop />
        </CartProvider>
      </body>
    </html>
  );
}
