"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/components/CartProvider";
import { buildProductOrderMessage, buildWhatsAppUrl } from "@/utils/whatsapp";

function isMongoId(id) {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
}

function badgeClass(q) {
  if (q === "Original") return "bg-emerald-500/15 text-emerald-800 ring-emerald-500/20";
  if (q === "High" || q === "High Copy") return "bg-amber-500/15 text-amber-900 ring-amber-500/25";
  if (q === "Low" || q === "Low Copy") return "bg-zinc-500/10 text-zinc-700 ring-zinc-500/15";
  return "bg-zinc-500/10 text-zinc-700 ring-zinc-500/15";
}

function categoryLabel(product) {
  const c = product?.category;
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && c.name) return c.name;
  return product?.categoryId?.name || "";
}

export default function ShopProductQuickView({ product, onClose }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [detail, setDetail] = useState(product);
  const [cartFlash, setCartFlash] = useState(false);

  useEffect(() => {
    if (!isMongoId(product._id)) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/products/${product._id}`, { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && res.ok && data.product) {
          setDetail(data.product);
        }
      } catch {
        /* keep list payload */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [product._id]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  if (typeof document === "undefined") return null;

  const p =
    detail && String(detail._id ?? "") === String(product._id ?? "")
      ? { ...product, ...detail }
      : product;

  const imgs = Array.isArray(p.images) && p.images.length ? p.images : [];
  const main = imgs[activeImg] || imgs[0];
  const unit = Number(p.price) || 0;
  const lineTotal = unit * qty;
  const cat = categoryLabel(p);
  const waHref = buildWhatsAppUrl(buildProductOrderMessage(p, qty));

  const node = (
    <AnimatePresence>
      <motion.div
        key={product._id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qv-title"
      >
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative z-[201] flex max-h-[min(92dvh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-black/10 bg-white shadow-2xl sm:max-h-[min(88vh,820px)] sm:rounded-3xl"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-4 py-3 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFA500]">Product details</p>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-2xl leading-none text-black/50 transition hover:bg-black/[0.05] hover:text-black"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="grid gap-6 p-4 sm:gap-8 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="space-y-3">
                <div className="relative aspect-square overflow-hidden rounded-2xl border border-black/[0.06] bg-zinc-100">
                  {main ? (
                    <Image src={main} alt={p.name} fill className="object-cover" sizes="(max-width:1024px) 90vw, 400px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-black/40">No image</div>
                  )}
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 backdrop-blur-md ${badgeClass(p.quality)}`}
                  >
                    {p.quality}
                  </span>
                </div>
                {imgs.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {imgs.map((src, i) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setActiveImg(i)}
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                          i === activeImg ? "border-[#FFA500]" : "border-transparent opacity-75 hover:opacity-100"
                        }`}
                      >
                        <Image src={src} alt="" fill className="object-cover" sizes="64px" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-col">
                {cat ? (
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FFA500]">{cat}</p>
                ) : null}
                <h2 id="qv-title" className="mt-1 text-xl font-bold leading-snug tracking-tight text-black sm:text-2xl">
                  {p.name}
                </h2>
                <p className="mt-2 text-sm text-black/55">
                  {p.brand}
                  {p.model ? ` · ${p.model}` : ""}
                </p>
                <div className="mt-4 flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl font-bold text-black sm:text-3xl">₹{unit.toLocaleString("en-IN")}</span>
                  {qty > 1 ? (
                    <span className="text-sm text-black/50">
                      × {qty} = <span className="font-semibold text-black">₹{lineTotal.toLocaleString("en-IN")}</span>
                    </span>
                  ) : null}
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-black/45">Quantity</p>
                  <div className="mt-2 inline-flex items-center rounded-2xl border border-black/10 bg-zinc-50 p-1">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-semibold text-black transition hover:bg-white"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={qty}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        setQty(Number.isFinite(n) && n >= 1 ? Math.min(999, n) : 1);
                      }}
                      className="h-11 w-14 border-0 bg-transparent text-center text-base font-bold text-black outline-none"
                    />
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-semibold text-black transition hover:bg-white"
                      onClick={() => setQty((q) => Math.min(999, q + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      addItem(p, qty);
                      setCartFlash(true);
                      setTimeout(() => setCartFlash(false), 1800);
                    }}
                    className="min-h-[48px] min-w-[160px] flex-1 rounded-2xl bg-black px-6 text-sm font-bold text-[#FFA500] transition hover:bg-zinc-900 sm:flex-none"
                  >
                    {cartFlash ? "Added to cart ✓" : "Add to cart"}
                  </button>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition hover:scale-105 hover:bg-[#1ebe5d] sm:h-[48px] sm:w-[48px]"
                    aria-label="Order on WhatsApp"
                    title="WhatsApp"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                </div>
                <p className="mt-2 text-xs text-black/45">WhatsApp opens with this product and quantity filled in.</p>

                {p.description ? (
                  <div className="mt-8 rounded-2xl border border-black/[0.06] bg-zinc-50/80 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40">Description</h3>
                    <p className="mt-2 max-h-40 overflow-y-auto text-sm leading-relaxed text-black/70 whitespace-pre-wrap">
                      {p.description}
                    </p>
                  </div>
                ) : null}

                <div className="mt-6 border-t border-black/10 pt-4">
                  <Link
                    href={`/product/${p._id}`}
                    onClick={onClose}
                    className="text-sm font-semibold text-[#cc7700] hover:underline"
                  >
                    Open full product page →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(node, document.body);
}
