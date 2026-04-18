import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import Navbar from "@/components/Navbar";
import MainShell from "@/components/MainShell";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ScrollToTop from "@/components/ScrollToTop";

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

export const metadata = {
  metadataBase: new URL("https://chachamobile.in"),
  title: {
    default: "Chacha Mobile | Spare Parts & Repair",
    template: "%s | Chacha Mobile",
  },
  description:
    "Chacha Mobile — mobile spare parts shop. Displays, batteries, charging jacks, body folders, speakers, cameras. Order on WhatsApp.",
  openGraph: {
    title: "Chacha Mobile",
    description: "Mobile spare parts & repair — shop online, order on WhatsApp.",
    url: "https://chachamobile.in",
    siteName: "Chacha Mobile",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full`}
    >
      <body className="app-site-shell min-h-full flex flex-col antialiased">
        <CartProvider>
          <Navbar />
          <MainShell>{children}</MainShell>
          <Footer />
          <WhatsAppFloat />
          <ScrollToTop />
        </CartProvider>
      </body>
    </html>
  );
}
