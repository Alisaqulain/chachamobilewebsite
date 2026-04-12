"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { buildCartOrderMessage, buildWhatsAppUrl } from "@/utils/whatsapp";

export default function CartPage() {
  const { items, updateQty, removeItem, totalQty, subtotal } = useCart();

  const checkoutHref =
    items.length > 0 ? buildWhatsAppUrl(buildCartOrderMessage(items)) : "#";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <h1 className="text-3xl font-extrabold text-black">Your cart</h1>
      <p className="mt-1 text-sm text-black/65">
        Cart is saved on this device only. Checkout opens WhatsApp with your order message.
      </p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-black/20 bg-zinc-50 p-10 text-center">
          <p className="text-black/70">Your cart is empty.</p>
          <Link
            href="/shop"
            className="mt-4 inline-flex rounded-full bg-[#FFA500] px-6 py-2.5 text-sm font-bold text-black"
          >
            Browse shop
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((line) => (
            <li
              key={line.productId}
              className="flex gap-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
            >
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
                  className="font-semibold text-black hover:text-[#cc7700]"
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
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="mt-8 rounded-2xl border border-black/10 bg-zinc-50 p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-black/65">Total items</span>
            <span className="font-bold text-black">{totalQty}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-lg">
            <span className="font-semibold text-black">Subtotal</span>
            <span className="font-black text-black">₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <a
            href={checkoutHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#1ebe5d]"
          >
            Checkout on WhatsApp
          </a>
          <p className="mt-3 text-center text-xs text-black/50">
            We will pre-fill: product lines and total item count. You can edit the message before
            sending.
          </p>
        </div>
      )}
    </div>
  );
}
