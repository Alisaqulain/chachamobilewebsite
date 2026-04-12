export const metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-3xl font-extrabold text-black">Terms & Conditions</h1>
      <p className="mt-2 text-sm text-black/60">Last updated: April 12, 2026</p>
      <ul className="mt-8 list-disc space-y-4 pl-5 text-sm leading-relaxed text-black/80">
        <li>
          <strong className="text-black">No return without checking.</strong> Please verify the
          part visually and for compatibility before leaving the counter / before installation
          where applicable. Returns are not accepted once the item is accepted after inspection,
          except as per our return policy for defective items.
        </li>
        <li>
          <strong className="text-black">Product quality disclaimer.</strong> Product quality
          grades (Original / High Copy / Low Copy) are described to the best of our knowledge.
          Small cosmetic or batch variations may exist. Installation results may vary based on
          technician skill and device condition.
        </li>
        <li>
          <strong className="text-black">Pricing subject to change.</strong> Prices on the
          website are indicative and may change due to supplier rates, exchange fluctuations, or
          stock availability. Final price is confirmed on WhatsApp at the time of order.
        </li>
        <li>
          <strong className="text-black">Orders.</strong> Sending a WhatsApp message does not
          guarantee allocation until confirmed by our team (especially for fast-moving SKUs).
        </li>
      </ul>
    </div>
  );
}
