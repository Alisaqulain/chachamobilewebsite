export const metadata = {
  title: "Shipping & Order Policy",
};

export default function ShippingPage() {
  return (
    <div className="page-3d-enter mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-3xl font-extrabold text-white">Shipping & Order Policy</h1>
      <p className="mt-2 text-sm text-white/60">Last updated: April 12, 2026</p>
      <ul className="mt-8 list-disc space-y-4 pl-5 text-sm leading-relaxed text-white/75">
        <li>
          <strong className="text-white">Orders via WhatsApp.</strong> All orders are coordinated
          over WhatsApp. Use the cart checkout button to send a pre-filled message, or message us
          directly.
        </li>
        <li>
          <strong className="text-white">Local delivery & pickup.</strong> Delivery options
          (local courier / hand delivery) and pickup from shop depend on your location and stock.
          Timelines are shared during WhatsApp confirmation.
        </li>
        <li>
          <strong className="text-white">Payment.</strong> Payment mode (cash / UPI / other) is
          confirmed on WhatsApp. Do not send OTPs or sensitive banking information to unknown
          numbers — verify you are chatting with our official contact.
        </li>
        <li>
          <strong className="text-white">Partial fulfilment.</strong> If one line item is
          unavailable, we may offer alternatives or remove the line from your order after
          discussion.
        </li>
      </ul>
    </div>
  );
}
