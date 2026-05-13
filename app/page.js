import HomePage from "@/components/home/HomePage";
import HomeLocalSeoSection from "@/components/home/HomeLocalSeoSection";
import { SITE_NAME } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Mobile spare parts Muzaffarnagar, Meerut, Shamli & UP | ${SITE_NAME}`,
  description: `Wholesale & retail mobile spare parts across Uttar Pradesh — Muzaffarnagar, Meerut, Shamli. Displays, batteries, repair parts. Order on WhatsApp. India-focused ${SITE_NAME}.`,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} | Mobile spare parts UP`,
    description:
      "Graded displays, batteries & repair parts for Western UP shops. WhatsApp ordering, clear invoices.",
    url: "/",
  },
};

export default function Page() {
  return (
    <>
      <HomePage />
      <HomeLocalSeoSection />
    </>
  );
}
