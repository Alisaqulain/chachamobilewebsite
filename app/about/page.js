export const metadata = {
  title: "About us",
  description: "Learn about Chacha Mobile spare parts shop and how we serve customers.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-3xl font-extrabold text-black">About Chacha Mobile</h1>
      <p className="mt-2 text-sm text-[#cc7700] font-semibold">chachamobile.in</p>
      <div className="prose prose-sm mt-8 max-w-none text-black/80">
        <p>
          Chacha Mobile is a dedicated mobile spare parts shop focused on helping technicians and
          customers find the right components quickly — from displays and batteries to charging
          ports, body folders, speakers, and cameras.
        </p>
        <p className="mt-4">
          We believe in transparent quality labels (Original / High Copy / Low Copy), fair
          pricing, and simple ordering over WhatsApp so you can confirm availability and delivery
          options without friction.
        </p>
        <p className="mt-4">
          Our catalogue is managed in-house: products can be added or updated regularly to match
          market demand. If you do not see a part, message us — we may still be able to source it.
        </p>
      </div>
    </div>
  );
}
