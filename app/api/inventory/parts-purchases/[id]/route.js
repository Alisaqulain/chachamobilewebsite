import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import PartsPurchase from "@/models/PartsPurchase";
import InventoryStockGroup from "@/models/InventoryStockGroup";
import SalesCategory from "@/models/SalesCategory";
import {
  applyPartsPurchaseDelete,
  applyPartsPurchaseLimitedUpdate,
  ensureGroupForLine,
  getReturnedQtyForPurchase,
  toProductId,
} from "@/lib/partsInventory";
import { resolveProductQualityName } from "@/lib/productQualityHelpers";

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

export async function GET(request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const p = await PartsPurchase.findById(id).lean();
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const sc = await SalesCategory.findById(p.salesCategoryId).select("name").lean();
    return NextResponse.json({
      purchase: {
        _id: String(p._id),
        supplierId: String(p.supplierId),
        stockGroupId: String(p.stockGroupId),
        date: p.date,
        salesCategoryId: String(p.salesCategoryId),
        salesCategoryName: sc?.name || "",
        mobileName: p.mobileName,
        productName: p.productName,
        quality: p.quality,
        quantity: Number(p.quantity),
        purchasePrice: Number(p.purchasePrice),
        gstAmount: Number(p.gstAmount ?? 0),
        signatureName: p.signatureName || "",
        notes: p.notes || "",
        lineTotal: Number(p.lineTotal),
        linkedProductId: p.linkedProductId ? String(p.linkedProductId) : "",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await request.json();
    await connectDB();
    const prev = await PartsPurchase.findById(id).lean();
    if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const quantity = Number(body?.quantity ?? prev.quantity);
    const purchasePrice = Number(body?.purchasePrice ?? prev.purchasePrice);
    const gstAmount = Number(body?.gstAmount ?? prev.gstAmount ?? 0);
    const notes = String(body?.notes ?? prev.notes ?? "");
    const signatureName =
      body?.signatureName !== undefined ? String(body?.signatureName ?? "").trim() : String(prev.signatureName ?? "").trim();
    const date = body?.date ? new Date(body.date) : prev.date;
    const linkedProductId =
      body.linkedProductId !== undefined
        ? toProductId(body.linkedProductId)
        : toProductId(prev.linkedProductId);
    const mobileName =
      body?.mobileName !== undefined
        ? normalizeAliasText(body.mobileName)
        : normalizeAliasText(prev.mobileName);
    const productName =
      body?.productName !== undefined
        ? normalizeAliasText(body.productName)
        : normalizeAliasText(prev.productName);
    const qualityInput = body?.quality !== undefined ? body.quality : prev.quality;
    const qualityResolved = await resolveProductQualityName(qualityInput);
    if (!qualityResolved.ok) return NextResponse.json({ error: qualityResolved.error }, { status: 400 });
    const quality = qualityResolved.name;

    const lineTotal = quantity * purchasePrice + (Number.isFinite(gstAmount) ? Math.max(0, gstAmount) : 0);
    const identityChanged =
      mobileName !== normalizeAliasText(prev.mobileName) ||
      productName !== normalizeAliasText(prev.productName) ||
      quality !== String(prev.quality || "");

    if (identityChanged) {
      if (!mobileName || !productName) {
        return NextResponse.json({ error: "Branch and model / product are required" }, { status: 400 });
      }
      if (linkedProductId) {
        return NextResponse.json(
          { error: "Change linked product line names from product mapping flow only." },
          { status: 400 }
        );
      }
      const returnedQty = await getReturnedQtyForPurchase(prev._id);
      if (returnedQty > 0) {
        return NextResponse.json(
          { error: "This line has returns. Remove returns first, then edit branch/model/quality." },
          { status: 400 }
        );
      }
    }

    await applyPartsPurchaseLimitedUpdate(prev, {
      quantity,
      linkedProductId,
      date,
    });

    let stockGroupId = prev.stockGroupId;
    if (identityChanged) {
      const newGroup = await ensureGroupForLine({
        salesCategoryId: prev.salesCategoryId,
        mobileName,
        productName,
        quality,
      });
      await InventoryStockGroup.updateOne({ _id: prev.stockGroupId }, { $inc: { purchasedQty: -quantity } });
      await InventoryStockGroup.updateOne(
        { _id: newGroup._id },
        { $inc: { purchasedQty: quantity }, $set: { lastPurchaseAt: date || new Date() } }
      );
      stockGroupId = newGroup._id;
    }

    await PartsPurchase.updateOne(
      { _id: id },
      {
        $set: {
          mobileName,
          productName,
          quality,
          stockGroupId,
          quantity,
          purchasePrice,
          gstAmount: Number.isFinite(gstAmount) ? Math.max(0, gstAmount) : 0,
          signatureName,
          notes,
          lineTotal,
          linkedProductId: linkedProductId || null,
          date,
        },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const prev = await PartsPurchase.findById(id).lean();
    if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await applyPartsPurchaseDelete(prev);
    await PartsPurchase.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to delete" }, { status: 500 });
  }
}
