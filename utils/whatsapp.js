const DEFAULT_WA = "918126162661";

export function getWhatsAppNumber() {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || DEFAULT_WA;
}

export function buildWhatsAppUrl(message) {
  const num = getWhatsAppNumber().replace(/\D/g, "");
  const text = encodeURIComponent(message);
  return `https://wa.me/${num}?text=${text}`;
}

export function buildCartOrderMessage(items) {
  const lines = items.map((i) => {
    const qty = i.qty > 1 ? ` x${i.qty}` : "";
    return `${i.name}${qty}`;
  });
  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  return ["Hello, I want to order:", "", ...lines, "", `Total Items: ${totalItems}`].join("\n");
}

/** Single-line product enquiry for WhatsApp (includes quantity and line total). */
export function buildProductOrderMessage(product, qty = 1) {
  const name = product?.name || "Product";
  const brand = product?.brand || "";
  const model = product?.model || "";
  const unit = Number(product?.price) || 0;
  const meta = [brand, model].filter(Boolean).join(" ");
  const suffix = meta ? ` (${meta})` : "";
  const q = Math.max(1, Number(qty) || 1);
  const total = unit * q;
  if (q <= 1) {
    return `Hello Chacha Mobile — I want to order:\n${name}${suffix}\nQty: 1\nPrice: ₹${unit.toLocaleString("en-IN")}`;
  }
  return `Hello Chacha Mobile — I want to order:\n${name}${suffix}\nQty: ${q}\nUnit: ₹${unit.toLocaleString("en-IN")}\nLine total: ₹${total.toLocaleString("en-IN")}`;
}
