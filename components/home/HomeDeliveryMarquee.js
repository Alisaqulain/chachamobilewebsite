"use client";

const LOCATIONS = [
  "Muzaffarnagar",
  "Meerut",
  "Shamli",
  "Saharanpur",
  "Baghpat",
  "Western UP",
  "Panipat corridor",
  "Delhi NCR spill-over",
];

export default function HomeDeliveryMarquee() {
  const doubled = [...LOCATIONS, ...LOCATIONS];

  return (
    <section className="relative border-y border-white/10 bg-black py-3">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-black to-transparent" />
      <div className="flex items-center gap-4 px-4">
        <span className="hidden shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-brand sm:inline">
          Dispatch
        </span>
        <div className="marquee-mask flex-1 overflow-hidden">
          <div className="marquee-track flex w-max gap-8">
            {doubled.map((label, i) => (
              <span
                key={`${label}-${i}`}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55"
              >
                <span className="h-1 w-1 rounded-full bg-brand shadow-[0_0_8px_rgba(255,102,0,0.8)]" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
