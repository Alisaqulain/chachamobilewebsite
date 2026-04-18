import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import PartsPurchase from "@/models/PartsPurchase";
import PartsPurchaseReturn from "@/models/PartsPurchaseReturn";
import {
  validatePartsReturnQuantity,
  applyPartsReturnLedger,
  applyPartsReturnDelete,
} from "@/lib/partsInventory";

export async function GET(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const partsPurchaseId = searchParams.get("partsPurchaseId")?.trim();
    if (!partsPurchaseId || !mongoose.Types.ObjectId.isValid(partsPurchaseId)) {
      return NextResponse.json({ error: "partsPurchaseId required" }, { status: 400 });
    }
    await connectDB();
    const rows = await PartsPurchaseReturn.find({ partsPurchaseId })
      .sort({ date: -1 })
      .lean();
    return NextResponse.json({
      returns: rows.map((r) => ({
        _id: String(r._id),
        partsPurchaseId: String(r.partsPurchaseId),
        supplierId: String(r.supplierId),
        stockGroupId: String(r.stockGroupId),
        quantity: Number(r.quantity),
        date: r.date,
        notes: r.notes || "",
        createdAt: r.createdAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const partsPurchaseId = String(body?.partsPurchaseId || "");
    const quantity = Number(body?.quantity);
    const date = body?.date ? new Date(body.date) : new Date();
    const notes = String(body?.notes ?? "").trim();

    if (!mongoose.Types.ObjectId.isValid(partsPurchaseId)) {
      return NextResponse.json({ error: "Invalid purchase" }, { status: 400 });
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    await connectDB();
    const purchase = await PartsPurchase.findById(partsPurchaseId).lean();
    if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });

    await validatePartsReturnQuantity(purchase, quantity);

    const ret = await PartsPurchaseReturn.create({
      partsPurchaseId: purchase._id,
      supplierId: purchase.supplierId,
      stockGroupId: purchase.stockGroupId,
      quantity,
      date,
      notes,
    });

    await applyPartsReturnLedger(purchase, quantity, ret._id);
    return NextResponse.json({ ok: true, returnId: String(ret._id) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

