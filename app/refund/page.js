export const metadata = {
  title: "Return & Refund Policy",
};

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-3xl font-extrabold text-black">Return & Refund Policy</h1>
      <p className="mt-2 text-sm text-black/60">Last updated: April 12, 2026</p>
      <ul className="mt-8 list-disc space-y-4 pl-5 text-sm leading-relaxed text-black/80">
        <li>
          <strong className="text-black">Defective items only.</strong> Replacement or repair
          consideration is limited to manufacturing defects reported promptly and subject to
          inspection. Physical damage, bent pins, torn flex, water damage, or improper installation
          are not covered.
        </li>
        <li>
          <strong className="text-black">No refund on installed parts.</strong> Once a part has
          been installed or attempted to be installed (adhesive removed, flex connected, soldered,
          etc.), refunds are generally not provided. Please test fit and function before
          installation where possible.
        </li>
        <li>
          <strong className="text-black">How to report.</strong> Share clear photos/videos on
          WhatsApp and keep the original packaging where possible. Our team will guide next steps.
        </li>
        <li>
          <strong className="text-black">Final decision.</strong> Eligibility for replacement or
          store credit is decided case-by-case after inspection, in line with supplier policies
          where applicable.
        </li>
      </ul>
    </div>
  );
}
