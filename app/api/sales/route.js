import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import Sale from "@/models/Sale";
import Customer from "@/models/Customer";
import { applyStockDeltas, getProductsMapByIds } from "@/lib/stock";

function rowTotal(row) {
  return Number(row.quantity || 0) * Number(row.price || 0);
}

function sanitizeItems(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((x) => ({
      productId: String(x?.productId || ""),
      quantity: Number(x?.quantity || 0),
      price: Number(x?.price || 0),
    }))
    .filter((x) => mongoose.Types.ObjectId.isValid(x.productId) && x.quantity > 0 && x.price >= 0);
}

export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const rows = await Sale.find()
      .sort({ date: -1, createdAt: -1 })
      .limit(120)
      .populate("customerId", "name phone")
      .populate("products.productId", "name")
      .lean();
    const sales = rows.map((s) => ({
      _id: String(s._id),
      customerId: s.customerId
        ? { _id: String(s.customerId._id), name: s.customerId.name, phone: s.customerId.phone || "" }
        : null,
      walkInName: String(s.walkInName || ""),
      walkInPhone: String(s.walkInPhone || ""),
      customerLabel:
        s.customerId && typeof s.customerId === "object" && s.customerId.name
          ? s.customerId.name
          : [s.walkInName, s.walkInPhone].filter(Boolean).join(" · ") || "Walk-in customer",
      products: (s.products || []).map((r) => ({
        productId: r.productId ? { _id: String(r.productId._id), name: r.productId.name } : null,
        quantity: Number(r.quantity || 0),
        price: Number(r.price || 0),
        lineTotal: rowTotal(r),
      })),
      totalAmount: Number(s.totalAmount || 0),
      date: s.date,
      createdAt: s.createdAt,
    }));
    return NextResponse.json({ sales });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load sales" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const customerIdRaw = String(body?.customerId || "").trim();
    const walkInName = String(body?.walkInName ?? "").trim();
    const walkInPhone = String(body?.walkInPhone ?? "").trim();
    const date = body?.date ? new Date(body.date) : new Date();
    const items = sanitizeItems(body?.products);
    const useSavedCustomer = Boolean(customerIdRaw && mongoose.Types.ObjectId.isValid(customerIdRaw));
    if (!useSavedCustomer && customerIdRaw) {
      return NextResponse.json({ error: "Select a valid customer or clear the field for walk-in" }, { status: 400 });
    }
    if (!items.length) {
      return NextResponse.json({ error: "Add at least one product row" }, { status: 400 });
    }
    const totalAmount = items.reduce((s, r) => s + rowTotal(r), 0);
    await connectDB();
    let customerId = null;
    if (useSavedCustomer) {
      const customer = await Customer.findById(customerIdRaw).lean();
      if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 400 });
      customerId = customer._id;
    }
    const productsMap = await getProductsMapByIds(items.map((x) => x.productId));
    for (const row of items) {
      const p = productsMap.get(String(row.productId));
      if (!p) return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
      if (Number(p.stock || 0) < Number(row.quantity || 0)) {
        return NextResponse.json({ error: `Insufficient stock for ${p.name}` }, { status: 400 });
      }
    }
    const sale = await Sale.create({
      customerId,
      walkInName: useSavedCustomer ? "" : walkInName,
      walkInPhone: useSavedCustomer ? "" : walkInPhone,
      products: items,
      totalAmount,
      date,
    });
    await applyStockDeltas(
      items.map((r) => ({
        productId: r.productId,
        delta: -Number(r.quantity || 0),
        reason: "sale",
        refModel: "Sale",
        refId: sale._id,
        note: "Sales entry",
      }))
    );
    return NextResponse.json({ ok: true, saleId: String(sale._id) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to save sale" }, { status: 500 });
  }
}
