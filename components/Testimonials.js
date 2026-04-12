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
    <section className="relative overflow-hidden bg-gradient-to-b from-zinc-100 via-white to-zinc-100 py-16 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-[#FFA500]/12 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full bg-black/[0.04] blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#FFA500]">Trust</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl">
            Trusted by 1000+ technicians & shops
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-black/60 sm:text-base">
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
            className="testimonial-swiper w-full !pb-12"
          >
            {reviews.map((r) => (
              <SwiperSlide key={r.name} className="!h-auto">
                <figure className="mx-auto flex h-full max-w-lg flex-col rounded-2xl border border-black/[0.08] bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:p-9">
                  <div className="flex gap-0.5 text-base text-[#FFA500]" aria-hidden>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <span key={j}>★</span>
                    ))}
                  </div>
                  <blockquote className="mt-5 flex-1 text-base leading-relaxed text-black/80 sm:text-lg">
                    “{r.quote}”
                  </blockquote>
                  <figcaption className="mt-8 border-t border-black/[0.06] pt-5">
                    <p className="text-lg font-bold text-black">{r.name}</p>
                    <p className="mt-1 text-sm text-black/50">{r.role}</p>
                  </figcaption>
                </figure>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      <style jsx global>{`
        .testimonial-swiper .swiper-pagination-bullet {
          background: rgba(0, 0, 0, 0.2);
          opacity: 1;
        }
        .testimonial-swiper .swiper-pagination-bullet-active {
          background: #ffa500;
          width: 26px;
          border-radius: 999px;
        }
        .testimonial-swiper .swiper-pagination {
          bottom: 0 !important;
        }
      `}</style>
    </section>
  );
}
