export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-3xl font-extrabold text-black">Privacy Policy</h1>
      <p className="mt-2 text-sm text-black/60">Last updated: April 12, 2026</p>
      <ul className="mt-8 list-disc space-y-4 pl-5 text-sm leading-relaxed text-black/80">
        <li>
          <strong className="text-black">No customer accounts.</strong> This website does not
          require login or signup for shopping. We do not operate a traditional user account system
          for buyers.
        </li>
        <li>
          <strong className="text-black">Cart data.</strong> Your cart is stored locally in your
          browser (localStorage) on your device. It is not sent to our servers.
        </li>
        <li>
          <strong className="text-black">WhatsApp for communication.</strong> When you contact us
          on WhatsApp, your phone number and messages are processed by WhatsApp/Meta according to
          their policies. We use WhatsApp to respond to enquiries and confirm orders.
        </li>
        <li>
          <strong className="text-black">Admin access.</strong> Staff may access product and
          catalogue data stored in our systems for business operations. We do not sell personal
          data.
        </li>
      </ul>
    </div>
  );
}
