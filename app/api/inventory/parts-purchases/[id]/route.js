import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import PartsPurchase from "@/models/PartsPurchase";
import SalesCategory from "@/models/SalesCategory";
import {
  applyPartsPurchaseDelete,
  applyPartsPurchaseLimitedUpdate,
  toProductId,
} from "@/lib/partsInventory";

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
    const date = body?.date ? new Date(body.date) : prev.date;
    const linkedProductId =
      body.linkedProductId !== undefined
        ? toProductId(body.linkedProductId)
        : toProductId(prev.linkedProductId);

    const lineTotal = quantity * purchasePrice + (Number.isFinite(gstAmount) ? Math.max(0, gstAmount) : 0);

    await applyPartsPurchaseLimitedUpdate(prev, {
      quantity,
      linkedProductId,
      date,
    });

    await PartsPurchase.updateOne(
      { _id: id },
      {
        $set: {
          quantity,
          purchasePrice,
          gstAmount: Number.isFinite(gstAmount) ? Math.max(0, gstAmount) : 0,
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
