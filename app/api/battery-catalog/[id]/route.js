import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import BatteryCatalogItem from "@/models/BatteryCatalogItem";

function asText(v) {
  return String(v ?? "").trim();
}

function parsePriceToken(raw) {
  const t = asText(raw);
  if (!t) return NaN;
  if (/^\d+\s*-\s*\d+$/.test(t)) {
    const [a, b] = t.split("-").map((x) => x.trim());
    const joined = `${a}${b.padStart(2, "0")}`;
    return Number(joined);
  }
  const n = Number(t.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : NaN;
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
    const patch = {};
    if (body?.supplierKey != null) patch.supplierKey = asText(body.supplierKey) || "genius";
    if (body?.brand != null) patch.brand = asText(body.brand);
    if (body?.phoneModel != null) patch.phoneModel = asText(body.phoneModel);
    if (body?.batteryCode != null) patch.batteryCode = asText(body.batteryCode);
    if (body?.listPrice != null) patch.listPrice = parsePriceToken(body.listPrice);
    if (body?.active != null) patch.active = Boolean(body.active);

    if (patch.listPrice != null && (!Number.isFinite(patch.listPrice) || patch.listPrice < 0)) {
      return NextResponse.json({ error: "Invalid listPrice" }, { status: 400 });
    }

    await connectDB();
    const doc = await BatteryCatalogItem.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      item: {
        _id: String(doc._id),
        supplierKey: doc.supplierKey,
        brand: doc.brand,
        phoneModel: doc.phoneModel,
        batteryCode: doc.batteryCode,
        listPrice: Number(doc.listPrice || 0),
        active: Boolean(doc.active),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (e) {
    console.error(e);
    const msg = /duplicate key/i.test(String(e?.message || ""))
      ? "This battery item already exists"
      : "Failed to update battery item";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const doc = await BatteryCatalogItem.findByIdAndDelete(id).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete battery item" }, { status: 500 });
  }
}

