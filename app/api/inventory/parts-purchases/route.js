import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import PartsPurchase from "@/models/PartsPurchase";
import PartsPurchaseReturn from "@/models/PartsPurchaseReturn";
import SalesCategory from "@/models/SalesCategory";
import Supplier from "@/models/Supplier";
import {
  ensureGroupForLine,
  incrementGroupPurchased,
  toProductId,
  assertProductExists,
} from "@/lib/partsInventory";
import { resolveProductQualityName } from "@/lib/productQualityHelpers";
import { applyStockDeltas } from "@/lib/stock";
import { ensureSalesLedgerFolderId } from "@/lib/salesCategoryHelpers";

function searchTokens(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
}

function normalizeAliasText(s) {
  const seen = new Set();
  const out = [];
  for (const part of String(s || "").split(",")) {
    const value = part.trim().replace(/\s+/g, " ");
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out.join(", ");
}

function serialize(p, scMap, supplierName, returnedQty = 0) {
  const sc = p.salesCategoryId ? scMap.get(String(p.salesCategoryId)) : null;
  const purchased = Number(p.quantity);
  const returned = Number(returnedQty || 0);
  return {
    _id: String(p._id),
    supplierId: String(p.supplierId),
    supplierName: supplierName || "",
    stockGroupId: String(p.stockGroupId),
    date: p.date,
    salesCategoryId: String(p.salesCategoryId),
    salesCategoryName: sc?.name || "",
    mobileName: p.mobileName,
    productName: p.productName,
    quality: p.quality,
    quantity: purchased,
    returnedQty: returned,
    returnableQty: Math.max(0, purchased - returned),
    purchasePrice: Number(p.purchasePrice),
    gstAmount: Number(p.gstAmount ?? 0),
    signatureName: p.signatureName || "",
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
    const q = searchParams.get("q")?.trim() || "";
    const qToks = searchTokens(q);
    const filter = {};
    if (supplierId) {
      if (!mongoose.Types.ObjectId.isValid(supplierId)) {
        return NextResponse.json({ error: "Invalid supplierId" }, { status: 400 });
      }
      filter.supplierId = supplierId;
    }
    await connectDB();
    let rows = await PartsPurchase.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(supplierId ? 500 : 500)
      .lean();
    if (qToks.length > 0) {
      rows = rows.filter((r) => {
        const hay = [
          r.mobileName,
          r.productName,
          r.quality,
          r.signatureName,
          r.notes,
        ]
          .join(" ")
          .toLowerCase()
          .replace(/[,\-_/]+/g, " ")
          .replace(/\s+/g, " ");
        return qToks.every((t) => hay.includes(t));
      });
    }
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
    const scIds = [...new Set(rows.map((r) => String(r.salesCategoryId)))];
    const supIds = [...new Set(rows.map((r) => String(r.supplierId)))];
    const [cats, sups] = await Promise.all([
      SalesCategory.find({ _id: { $in: scIds } })
        .select("name")
        .lean(),
      Supplier.find({ _id: { $in: supIds } })
        .select("name")
        .lean(),
    ]);
    const scMap = new Map(cats.map((c) => [String(c._id), c]));
    const supMap = new Map(sups.map((s) => [String(s._id), s.name]));
    return NextResponse.json({
      purchases: rows.map((r) =>
        serialize(r, scMap, supMap.get(String(r.supplierId)) || "", returnedMap.get(String(r._id)) || 0)
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
    const salesCategoryIdRaw = String(body?.salesCategoryId || "").trim();
    const mobileName = normalizeAliasText(body?.mobileName || "");
    const productName = normalizeAliasText(body?.productName || "");
    const qualityRaw = body?.quality;
    const quantity = Number(body?.quantity);
    const purchasePrice = Number(body?.purchasePrice ?? 0);
    const gstAmount = Number(body?.gstAmount ?? 0);
    const notes = String(body?.notes ?? "").trim();
    const signatureName = String(body?.signatureName ?? "").trim();
    const date = body?.date ? new Date(body.date) : new Date();
    const linkedProductId = toProductId(body?.linkedProductId);

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return NextResponse.json({ error: "Invalid supplier" }, { status: 400 });
    }
    if (!mobileName || !productName) {
      return NextResponse.json(
        { error: "Folder name and model / product label are required (one purchase line = one quantity)." },
        { status: 400 }
      );
    }
    await connectDB();
    const salesCategoryId =
      salesCategoryIdRaw && mongoose.Types.ObjectId.isValid(salesCategoryIdRaw)
        ? salesCategoryIdRaw
        : await ensureSalesLedgerFolderId();
    const sc = await SalesCategory.findById(salesCategoryId).select("_id").lean();
    if (!sc) {
      return NextResponse.json({ error: "Invalid sales category" }, { status: 400 });
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }
    if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const qRes = await resolveProductQualityName(qualityRaw);
    if (!qRes.ok) return NextResponse.json({ error: qRes.error }, { status: 400 });

    await assertProductExists(linkedProductId);

    const gst = Number.isFinite(gstAmount) ? Math.max(0, gstAmount) : 0;
    const lineTotal = quantity * purchasePrice + gst;

    const group = await ensureGroupForLine({
      salesCategoryId,
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
      salesCategoryId,
      mobileName,
      productName,
      quality: qRes.name,
      quantity,
      purchasePrice,
      gstAmount: gst,
      signatureName,
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

    return NextResponse.json({
      ok: true,
      purchaseId: String(purchase._id),
      purchaseIds: [String(purchase._id)],
      linesCreated: 1,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to save" }, { status: 500 });
  }
}
