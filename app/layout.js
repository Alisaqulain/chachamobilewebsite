import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import Navbar from "@/components/Navbar";
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth`}>
      <body className="min-h-full flex flex-col bg-white text-black antialiased">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppFloat />
          <ScrollToTop />
        </CartProvider>
      </body>
    </html>
  );
}
