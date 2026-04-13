const items = [
  {
    title: "Wide range",
    text: "Popular brands and models — from displays to small flex connectors.",
  },
  {
    title: "Clear quality grades",
    text: "Original, high copy, and low copy options so you can pick what fits your budget.",
  },
  {
    title: "WhatsApp ordering",
    text: "No accounts needed. Add to cart and send your order message in one tap.",
  },
  {
    title: "Local focus",
    text: "Built for quick communication, local delivery, and pickup-friendly service.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="mt-16">
      <h2 className="text-center text-2xl font-bold text-black md:text-3xl">Why choose us</h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-black/65">
        Simple shopping, transparent quality labels, and fast WhatsApp support for technicians
        and retail customers.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <div
            key={it.title}
            className="surface-3d-hover rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:border-brand/40 hover:shadow-md"
          >
            <h3 className="text-lg font-bold text-black">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-black/70">{it.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
