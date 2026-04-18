import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import Purchase from "@/models/Purchase";
import Supplier from "@/models/Supplier";
import Product from "@/models/Product";
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
    const rows = await Purchase.find()
      .sort({ date: -1, createdAt: -1 })
      .limit(120)
      .populate("supplierId", "name phone")
      .populate("products.productId", "name")
      .lean();
    const purchases = rows.map((p) => ({
      _id: String(p._id),
      supplierId: p.supplierId
        ? { _id: String(p.supplierId._id), name: p.supplierId.name, phone: p.supplierId.phone || "" }
        : null,
      products: (p.products || []).map((r) => ({
        productId: r.productId ? { _id: String(r.productId._id), name: r.productId.name } : null,
        quantity: Number(r.quantity || 0),
        price: Number(r.price || 0),
        lineTotal: rowTotal(r),
      })),
      totalAmount: Number(p.totalAmount || 0),
      date: p.date,
      createdAt: p.createdAt,
    }));
    return NextResponse.json({ purchases });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load purchases" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const supplierId = String(body?.supplierId || "");
    const date = body?.date ? new Date(body.date) : new Date();
    const items = sanitizeItems(body?.products);
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return NextResponse.json({ error: "Select a valid supplier" }, { status: 400 });
    }
    if (!items.length) {
      return NextResponse.json({ error: "Add at least one product row" }, { status: 400 });
    }
    const totalAmount = items.reduce((s, r) => s + rowTotal(r), 0);
    await connectDB();
    const supplier = await Supplier.findById(supplierId).lean();
    if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 400 });
    const productsMap = await getProductsMapByIds(items.map((x) => x.productId));
    for (const row of items) {
      if (!productsMap.get(String(row.productId))) {
        return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
      }
    }
    const purchase = await Purchase.create({
      supplierId,
      products: items,
      totalAmount,
      date,
    });
    await applyStockDeltas(
      items.map((r) => ({
        productId: r.productId,
        delta: r.quantity,
        reason: "purchase",
        refModel: "Purchase",
        refId: purchase._id,
        note: "Purchase entry",
      }))
    );
    return NextResponse.json({ ok: true, purchaseId: String(purchase._id) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to save purchase" }, { status: 500 });
  }
}
