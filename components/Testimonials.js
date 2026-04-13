"use client";

import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const reviews = [
  {
    quote:
      "Panels arrive packed like retail jewellery. Colour calibration matches OEM — our premium lane finally has a single supplier.",
    name: "Neha Sharma",
    role: "Indore · Multi-store owner",
  },
  {
    quote:
      "We retired five WhatsApp threads. Grading is printed on the invoice — no more arguments at the counter.",
    name: "Rahul Sengupta",
    role: "Bench lead · Kolkata",
  },
  {
    quote:
      "Quotes in under ten minutes. That responsiveness alone paid for our first month of orders.",
    name: "A1 Mobiles Collective",
    role: "Retail chain · 6 cities",
  },
  {
    quote:
      "Charging flexes and small boards land without micro-scratches. QC feels like they actually repair.",
    name: "FixCraft Labs",
    role: "B2B workshop · Pune",
  },
  {
    quote:
      "Bulk pricing on batteries is transparent. We plan inventory weeks ahead now.",
    name: "Voltage Brothers",
    role: "Distributor · Delhi NCR",
  },
  {
    quote:
      "Camera modules AF-tested — we stopped eating returns on flagship jobs.",
    name: "PixelCare",
    role: "Premium service centre · Hyderabad",
  },
];

export default function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-900 to-black py-16 sm:py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(255,102,0,0.12),transparent)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-brand">Trust</p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Trusted by 1000+ technicians & shops
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/65 sm:text-base">
            Real feedback from repair floors — swipe through stories from teams who use Chacha Mobile.
          </p>
        </motion.div>

        <div className="relative mt-14 pb-12">
          <Swiper
            modules={[Autoplay, Pagination]}
            slidesPerView={1}
            spaceBetween={20}
            breakpoints={{
              768: { slidesPerView: 2, spaceBetween: 22 },
            }}
            loop
            autoplay={{ delay: 5200, disableOnInteraction: false }}
            pagination={{ clickable: true, dynamicBullets: true }}
            className="testimonial-swiper testimonial-swiper--dark w-full !pb-12"
          >
            {reviews.map((r) => (
              <SwiperSlide key={r.name} className="!h-auto">
                <figure className="card-gradient-border surface-3d-hover mx-auto flex h-full max-w-lg flex-col rounded-2xl bg-white p-7 shadow-[0_16px_50px_rgba(0,0,0,0.08)] sm:p-9">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-display text-4xl font-bold leading-none text-brand/30" aria-hidden>
                      “
                    </span>
                    <div className="flex gap-0.5 pt-1 text-base text-brand" aria-hidden>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span key={j}>★</span>
                      ))}
                    </div>
                  </div>
                  <blockquote className="mt-4 flex-1 text-base leading-relaxed text-black/80 sm:text-lg">
                    {r.quote}
                  </blockquote>
                  <figcaption className="mt-8 border-t border-black/[0.06] pt-5">
                    <p className="font-display text-lg font-bold text-black">{r.name}</p>
                    <p className="mt-1 text-sm text-black/50">{r.role}</p>
                  </figcaption>
                </figure>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
