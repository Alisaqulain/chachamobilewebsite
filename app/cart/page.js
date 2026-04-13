"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "@/components/CartProvider";
import { buildCartOrderMessage, buildWhatsAppUrl } from "@/utils/whatsapp";
import TiltCard from "@/components/TiltCard";

export default function CartPage() {
  const { items, updateQty, removeItem, totalQty, subtotal } = useCart();

  const checkoutHref =
    items.length > 0 ? buildWhatsAppUrl(buildCartOrderMessage(items)) : "#";

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 md:py-14">
      <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-brand/12 blur-[90px]" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand">Cart</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Your cart
        </h1>
        <p className="mt-2 text-sm text-white/65">
          Saved on this device only. Checkout opens WhatsApp with a pre-filled order you can edit.
        </p>
      </motion.div>

      {items.length === 0 ? (
        <div className="surface-3d-hover relative mt-10 rounded-3xl border border-dashed border-white/25 bg-white/[0.06] p-12 text-center shadow-inner backdrop-blur-sm">
          <p className="text-white/70">Your cart is empty — catalogue is one tap away.</p>
          <Link
            href="/shop"
            className="btn-3d-pop mt-6 inline-flex rounded-full bg-zinc-900 px-8 py-3 text-sm font-bold text-brand shadow-lg transition hover:bg-zinc-800"
          >
            Browse shop
          </Link>
        </div>
      ) : (
        <ul className="relative mt-8 space-y-4">
          {items.map((line) => (
            <li key={line.productId} className="list-none">
              <TiltCard className="block">
                <div className="flex gap-4 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.02] transition hover:border-brand/25">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                    {line.image ? (
                      <Image src={line.image} alt="" fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-black/40">
                        —
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${line.productId}`}
                      className="font-semibold text-black hover:text-brand-dim"
                    >
                      {line.name}
                    </Link>
                    <p className="text-xs text-black/55">
                      {line.model}
                      {line.quality ? ` · ${line.quality}` : ""}
                    </p>
                    <p className="mt-1 text-sm font-bold text-black">
                      ₹{line.price.toLocaleString("en-IN")} each
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="text-xs text-black/50">
                        Qty{" "}
                        <input
                          type="number"
                          min={1}
                          value={line.qty}
                          onChange={(e) =>
                            updateQty(line.productId, Number(e.target.value) || 1)
                          }
                          className="ml-1 w-16 rounded-lg border border-black/15 px-2 py-1 text-sm"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeItem(line.productId)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right text-sm font-bold text-black">
                    ₹{(line.price * line.qty).toLocaleString("en-IN")}
                  </div>
                </div>
              </TiltCard>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="surface-3d-hover relative mt-8 rounded-3xl border border-zinc-900 bg-zinc-900 p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Total items</span>
            <span className="font-bold text-brand">{totalQty}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xl">
            <span className="font-semibold text-white/90">Subtotal</span>
            <span className="font-display font-bold text-white">₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <a
            href={checkoutHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-3d-pop mt-8 flex w-full items-center justify-center rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#1ebe5d]"
          >
            Checkout on WhatsApp
          </a>
          <p className="mt-4 text-center text-xs text-white/45">
            We pre-fill product lines and totals — edit the message before you send.
          </p>
        </div>
      )}
    </div>
  );
}
