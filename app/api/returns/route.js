import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import ReturnEntry from "@/models/Return";
import Supplier from "@/models/Supplier";
import Customer from "@/models/Customer";
import { applyStockDeltas, getProductsMapByIds } from "@/lib/stock";

function sanitizeItems(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((x) => ({
      productId: String(x?.productId || ""),
      qty: Number(x?.qty || 0),
    }))
    .filter((x) => mongoose.Types.ObjectId.isValid(x.productId) && x.qty > 0);
}

export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const rows = await ReturnEntry.find().sort({ date: -1, createdAt: -1 }).limit(120).lean();
    const partyIds = [...new Set(rows.map((r) => r.partyId).filter(Boolean).map(String))];
    const [suppliers, customers] = await Promise.all([
      partyIds.length ? Supplier.find({ _id: { $in: partyIds } }).lean() : [],
      partyIds.length ? Customer.find({ _id: { $in: partyIds } }).lean() : [],
    ]);
    const supplierMap = new Map(suppliers.map((s) => [String(s._id), s]));
    const customerMap = new Map(customers.map((c) => [String(c._id), c]));

    return NextResponse.json({
      returns: rows.map((r) => {
        const pid = r.partyId ? String(r.partyId) : "";
        let partyLabel = pid;
        if (r.type === "purchase_return" && pid && supplierMap.has(pid)) {
          partyLabel = supplierMap.get(pid).name;
        } else if (r.type === "sale_return" && pid && customerMap.has(pid)) {
          partyLabel = customerMap.get(pid).name;
        } else if (r.type === "sale_return" && !pid) {
          partyLabel = [r.saleWalkInName, r.saleWalkInPhone].filter(Boolean).join(" · ") || "Walk-in";
        }
        return {
          _id: String(r._id),
          type: r.type,
          partyId: pid,
          partyLabel,
          saleWalkInName: String(r.saleWalkInName || ""),
          saleWalkInPhone: String(r.saleWalkInPhone || ""),
          products: (r.products || []).map((p) => ({
            productId: String(p.productId),
            qty: Number(p.qty || 0),
          })),
          date: r.date,
        };
      }),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load returns" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const type = String(body?.type || "");
    const partyIdRaw = String(body?.partyId || "").trim();
    const saleWalkInName = String(body?.saleWalkInName ?? "").trim();
    const saleWalkInPhone = String(body?.saleWalkInPhone ?? "").trim();
    const date = body?.date ? new Date(body.date) : new Date();
    const items = sanitizeItems(body?.products);
    if (!["purchase_return", "sale_return"].includes(type)) {
      return NextResponse.json({ error: "Invalid return type" }, { status: 400 });
    }
    if (!items.length) {
      return NextResponse.json({ error: "Add at least one product row" }, { status: 400 });
    }
    await connectDB();

    let partyId = null;
    if (type === "purchase_return") {
      if (!mongoose.Types.ObjectId.isValid(partyIdRaw)) {
        return NextResponse.json({ error: "Select a valid supplier" }, { status: 400 });
      }
      const supplier = await Supplier.findById(partyIdRaw).lean();
      if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 400 });
      partyId = supplier._id;
    } else {
      if (partyIdRaw) {
        if (!mongoose.Types.ObjectId.isValid(partyIdRaw)) {
          return NextResponse.json({ error: "Select a valid customer" }, { status: 400 });
        }
        const customer = await Customer.findById(partyIdRaw).lean();
        if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 400 });
        partyId = customer._id;
      }
    }
    const productsMap = await getProductsMapByIds(items.map((x) => x.productId));
    for (const row of items) {
      const p = productsMap.get(String(row.productId));
      if (!p) return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
      if (type === "purchase_return" && Number(p.stock || 0) < Number(row.qty || 0)) {
        return NextResponse.json({ error: `Insufficient stock for ${p.name}` }, { status: 400 });
      }
    }
    const entry = await ReturnEntry.create({
      type,
      partyId,
      saleWalkInName: type === "sale_return" && !partyId ? saleWalkInName : "",
      saleWalkInPhone: type === "sale_return" && !partyId ? saleWalkInPhone : "",
      products: items,
      date,
    });
    const isPurchaseReturn = type === "purchase_return";
    await applyStockDeltas(
      items.map((r) => ({
        productId: r.productId,
        delta: isPurchaseReturn ? -Number(r.qty || 0) : Number(r.qty || 0),
        reason: type,
        refModel: "ReturnEntry",
        refId: entry._id,
        note: isPurchaseReturn ? "Purchase return" : "Sales return",
      }))
    );
    return NextResponse.json({ ok: true, returnId: String(entry._id) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to save return" }, { status: 500 });
  }
}
