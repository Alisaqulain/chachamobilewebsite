import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import PartsPurchase from "@/models/PartsPurchase";
import PartsPurchaseReturn from "@/models/PartsPurchaseReturn";
import Category from "@/models/Category";
import Supplier from "@/models/Supplier";
import {
  ensureGroupForLine,
  incrementGroupPurchased,
  toProductId,
  assertProductExists,
} from "@/lib/partsInventory";
import { resolveProductQualityName } from "@/lib/productQualityHelpers";
import { applyStockDeltas } from "@/lib/stock";

function serialize(p, catMap, supplierName, returnedQty = 0) {
  const c = p.categoryId ? catMap.get(String(p.categoryId)) : null;
  const purchased = Number(p.quantity);
  const returned = Number(returnedQty || 0);
  return {
    _id: String(p._id),
    supplierId: String(p.supplierId),
    supplierName: supplierName || "",
    stockGroupId: String(p.stockGroupId),
    date: p.date,
    categoryId: String(p.categoryId),
    categoryName: c?.name || "",
    mobileName: p.mobileName,
    productName: p.productName,
    quality: p.quality,
    quantity: purchased,
    returnedQty: returned,
    returnableQty: Math.max(0, purchased - returned),
    purchasePrice: Number(p.purchasePrice),
    gstAmount: Number(p.gstAmount ?? 0),
    notes: p.notes || "",
    lineTotal: Number(p.lineTotal),
    linkedProductId: p.linkedProductId ? String(p.linkedProductId) : "",
    createdAt: p.createdAt,
  };
}

export async function GET(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId")?.trim();
    const filter = {};
    if (supplierId) {
      if (!mongoose.Types.ObjectId.isValid(supplierId)) {
        return NextResponse.json({ error: "Invalid supplierId" }, { status: 400 });
      }
      filter.supplierId = supplierId;
    }
    await connectDB();
    const rows = await PartsPurchase.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(supplierId ? 500 : 500)
      .lean();
    const purchaseIds = rows.map((r) => r._id);
    const returnedMap = new Map();
    if (purchaseIds.length) {
      const agg = await PartsPurchaseReturn.aggregate([
        { $match: { partsPurchaseId: { $in: purchaseIds } } },
        { $group: { _id: "$partsPurchaseId", totalReturned: { $sum: "$quantity" } } },
      ]);
      for (const row of agg) {
        returnedMap.set(String(row._id), Number(row.totalReturned || 0));
      }
    }
    const catIds = [...new Set(rows.map((r) => String(r.categoryId)))];
    const supIds = [...new Set(rows.map((r) => String(r.supplierId)))];
    const [cats, sups] = await Promise.all([
      Category.find({ _id: { $in: catIds } })
        .select("name")
        .lean(),
      Supplier.find({ _id: { $in: supIds } })
        .select("name")
        .lean(),
    ]);
    const catMap = new Map(cats.map((c) => [String(c._id), c]));
    const supMap = new Map(sups.map((s) => [String(s._id), s.name]));
    return NextResponse.json({
      purchases: rows.map((r) =>
        serialize(r, catMap, supMap.get(String(r.supplierId)) || "", returnedMap.get(String(r._id)) || 0)
      ),
    });
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
    const categoryId = String(body?.categoryId || "");
    const mobileName = String(body?.mobileName || "").trim();
    const productName = String(body?.productName || "").trim();
    const qualityRaw = body?.quality;
    const quantity = Number(body?.quantity);
    const purchasePrice = Number(body?.purchasePrice ?? 0);
    const gstAmount = Number(body?.gstAmount ?? 0);
    const notes = String(body?.notes ?? "").trim();
    const date = body?.date ? new Date(body.date) : new Date();
    const linkedProductId = toProductId(body?.linkedProductId);

    if (!mongoose.Types.ObjectId.isValid(supplierId) || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json({ error: "Invalid supplier or category" }, { status: 400 });
    }
    if (!mobileName || !productName) {
      return NextResponse.json({ error: "Mobile name and product name required" }, { status: 400 });
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }
    if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    await connectDB();
    const qRes = await resolveProductQualityName(qualityRaw);
    if (!qRes.ok) return NextResponse.json({ error: qRes.error }, { status: 400 });

    await assertProductExists(linkedProductId);

    const lineTotal = quantity * purchasePrice + (Number.isFinite(gstAmount) ? gstAmount : 0);

    const group = await ensureGroupForLine({
      categoryId,
      mobileName,
      productName,
      quality: qRes.name,
      linkedProductId,
    });
    await incrementGroupPurchased(group._id, quantity, date);

    const purchase = await PartsPurchase.create({
      supplierId,
      stockGroupId: group._id,
      date,
      categoryId,
      mobileName,
      productName,
      quality: qRes.name,
      quantity,
      purchasePrice,
      gstAmount: Number.isFinite(gstAmount) ? Math.max(0, gstAmount) : 0,
      notes,
      lineTotal,
      linkedProductId: linkedProductId || null,
    });

    if (linkedProductId) {
      await applyStockDeltas([
        {
          productId: linkedProductId,
          delta: quantity,
          reason: "purchase",
          refModel: "PartsPurchase",
          refId: purchase._id,
          note: "Parts purchase",
        },
      ]);
    }

    return NextResponse.json({ ok: true, purchaseId: String(purchase._id) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to save" }, { status: 500 });
  }
}
