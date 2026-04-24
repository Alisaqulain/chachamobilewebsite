import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import Sale from "@/models/Sale";
import { applyStockDeltas } from "@/lib/stock";
import { revertSoldQtyForSaleLineItems } from "@/lib/partsInventory";

function serializeLine(r) {
  const qty = Number(r.quantity || 0);
  const price = Number(r.price || 0);
  const gst = Number(r.gstAmount ?? 0);
  const sg = r.stockGroupId && typeof r.stockGroupId === "object" ? r.stockGroupId : null;
  const pr = r.productId && typeof r.productId === "object" ? r.productId : null;
  return {
    productId: pr ? { _id: String(pr._id), name: pr.name || "" } : null,
    stockGroupId: sg
      ? {
          _id: String(sg._id),
          mobileName: sg.mobileName || "",
          productName: sg.productName || "",
          quality: sg.quality || "",
        }
      : null,
    quantity: qty,
    price,
    gstAmount: gst,
    lineTotal: qty * price + gst,
  };
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
    const s = await Sale.findById(id)
      .populate("customerId", "name phone")
      .populate("products.productId", "name")
      .populate("products.stockGroupId", "mobileName productName quality salesCategoryId")
      .lean();
    if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const sale = {
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
      products: (s.products || []).map((r) => serializeLine(r)),
      totalAmount: Number(s.totalAmount || 0),
      date: s.date,
      createdAt: s.createdAt,
    };
    return NextResponse.json({ sale });
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
    const prev = await Sale.findById(id).lean();
    if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const date = body?.date ? new Date(body.date) : prev.date;
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const useSaved = Boolean(prev.customerId);
    if (useSaved) {
      await Sale.updateOne({ _id: id }, { $set: { date } });
    } else {
      const walkInName = String(body?.walkInName ?? prev.walkInName ?? "").trim();
      const walkInPhone = String(body?.walkInPhone ?? prev.walkInPhone ?? "").trim();
      if (!walkInName) return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
      await Sale.updateOne(
        { _id: id },
        { $set: { walkInName, walkInPhone, date } }
      );
    }

    const updated = await Sale.findById(id)
      .populate("customerId", "name phone")
      .populate("products.productId", "name")
      .populate("products.stockGroupId", "mobileName productName quality salesCategoryId")
      .lean();
    const sale = {
      _id: String(updated._id),
      customerId: updated.customerId
        ? { _id: String(updated.customerId._id), name: updated.customerId.name, phone: updated.customerId.phone || "" }
        : null,
      walkInName: String(updated.walkInName || ""),
      walkInPhone: String(updated.walkInPhone || ""),
      customerLabel:
        updated.customerId && typeof updated.customerId === "object" && updated.customerId.name
          ? updated.customerId.name
          : [updated.walkInName, updated.walkInPhone].filter(Boolean).join(" · ") || "Walk-in customer",
      products: (updated.products || []).map((r) => serializeLine(r)),
      totalAmount: Number(updated.totalAmount || 0),
      date: updated.date,
      createdAt: updated.createdAt,
    };
    return NextResponse.json({ sale });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
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
    const prev = await Sale.findById(id).lean();
    if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await revertSoldQtyForSaleLineItems(
      (prev.products || []).map((r) => ({
        stockGroupId: r.stockGroupId || null,
        productId: r.productId || null,
        quantity: r.quantity,
      }))
    );

    const shopLines = (prev.products || []).filter((r) => r.productId);
    if (shopLines.length) {
      await applyStockDeltas(
        shopLines.map((r) => ({
          productId: r.productId,
          delta: Number(r.quantity || 0),
          reason: "sale_delete",
          refModel: "Sale",
          refId: prev._id,
          note: "Sale deleted — stock restored",
        }))
      );
    }

    await Sale.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
