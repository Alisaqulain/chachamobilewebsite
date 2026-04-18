import PartsPurchase from "@/models/PartsPurchase";
import Product from "@/models/Product";
import Sale from "@/models/Sale";
import Category from "@/models/Category";
import Supplier from "@/models/Supplier";
import { ensureGroupForLine, incrementGroupPurchased } from "@/lib/partsInventory";
import { resolveProductQualityName } from "@/lib/productQualityHelpers";

const DEMO_NOTE = "__demoDashboard";

const DEMO_LINES = [
  { supplierIdx: 0, catIdx: 0, mobile: "iPhone 12", product: "Display assembly", qty: 4, price: 4200, monthOff: 0 },
  { supplierIdx: 0, catIdx: 0, mobile: "iPhone 12", product: "Back panel", qty: 15, price: 350, monthOff: 0 },
  { supplierIdx: 1, catIdx: 0, mobile: "Samsung M31", product: "Battery", qty: 8, price: 650, monthOff: 0 },
  { supplierIdx: 0, catIdx: 0, mobile: "iPhone 11", product: "Charging flex", qty: 20, price: 180, monthOff: 1 },
  { supplierIdx: 1, catIdx: 0, mobile: "Redmi Note 10", product: "Camera module", qty: 6, price: 1200, monthOff: 1 },
  { supplierIdx: 0, catIdx: 0, mobile: "iPhone 12", product: "Speaker mesh", qty: 25, price: 95, monthOff: 2 },
  { supplierIdx: 2, catIdx: 0, mobile: "Vivo Y20", product: "LCD combo", qty: 3, price: 2100, monthOff: 2 },
  { supplierIdx: 1, catIdx: 0, mobile: "Oppo A53", product: "Fingerprint flex", qty: 12, price: 220, monthOff: 3 },
  { supplierIdx: 0, catIdx: 0, mobile: "iPhone 13", product: "Rear glass", qty: 7, price: 890, monthOff: 4 },
  { supplierIdx: 1, catIdx: 0, mobile: "Realme 8", product: "Mainboard", qty: 2, price: 4500, monthOff: 5 },
];

function monthDate(monthOff, dayOfMonth) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(dayOfMonth);
  d.setMonth(d.getMonth() - monthOff);
  return d;
}

/**
 * Idempotent: skips if any parts purchase already has DEMO_NOTE.
 */
export async function seedPartsDashboardDemo() {
  const exists = await PartsPurchase.exists({ notes: DEMO_NOTE });
  if (exists) {
    return {
      ok: true,
      skipped: true,
      message: "Demo parts rows already exist. Delete purchases with notes __demoDashboard to re-seed.",
    };
  }

  const categories = await Category.find().sort({ name: 1 }).limit(3).lean();
  if (!categories.length) {
    throw new Error("Add at least one category (Sales system → Categories) before seeding.");
  }

  const suppliers = await Supplier.find().sort({ name: 1 }).limit(5).lean();
  if (!suppliers.length) {
    throw new Error("Add at least one supplier before seeding.");
  }

  const qRes = await resolveProductQualityName("Original");
  if (!qRes.ok) throw new Error(qRes.error);

  let partsCreated = 0;
  let dayRoll = 0;
  for (const row of DEMO_LINES) {
    const sup = suppliers[row.supplierIdx % suppliers.length];
    const cat = categories[row.catIdx % categories.length];
    const date = monthDate(row.monthOff, 8 + (dayRoll % 12));
    dayRoll += 1;

    const group = await ensureGroupForLine({
      categoryId: cat._id,
      mobileName: row.mobile,
      productName: row.product,
      quality: qRes.name,
    });
    await incrementGroupPurchased(group._id, row.qty, date);

    const lineTotal = row.qty * row.price;
    await PartsPurchase.create({
      supplierId: sup._id,
      stockGroupId: group._id,
      date,
      categoryId: cat._id,
      mobileName: row.mobile,
      productName: row.product,
      quality: qRes.name,
      quantity: row.qty,
      purchasePrice: row.price,
      gstAmount: 0,
      notes: DEMO_NOTE,
      lineTotal,
    });
    partsCreated += 1;
  }

  const products = await Product.find().limit(3).lean();
  let salesCreated = 0;
  if (products.length) {
    const p0 = products[0];
    const price = Math.max(500, Number(p0.sellingPrice ?? p0.price ?? 999));
    for (const monthOff of [0, 1, 2, 3]) {
      const qty = 2 + (monthOff % 2);
      const date = monthDate(monthOff, 18);
      const total = qty * price;
      await Sale.create({
        customerId: null,
        walkInName: "Demo customer",
        walkInPhone: "",
        products: [{ productId: p0._id, quantity: qty, price }],
        totalAmount: total,
        date,
      });
      salesCreated += 1;
    }
  }

  return {
    ok: true,
    skipped: false,
    partsPurchaseLinesCreated: partsCreated,
    shopSalesCreated: salesCreated,
    message:
      products.length === 0
        ? "Parts demo created. No shop products found — shop sales demo skipped."
        : "Parts + shop sales demo created.",
  };
}
