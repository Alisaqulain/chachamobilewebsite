import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Supplier from "@/models/Supplier";
import { getAdminFromCookies } from "@/lib/auth";
import { UNKNOWN_SUPPLIER_NAME } from "@/lib/partsInventory";

export async function PUT(request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await request.json();
    const name = String(body?.name || "").trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    await connectDB();
    const existing = await Supplier.findById(id).lean();
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.name === UNKNOWN_SUPPLIER_NAME && name !== UNKNOWN_SUPPLIER_NAME) {
      return NextResponse.json({ error: "Cannot rename the default supplier" }, { status: 400 });
    }
    const supplier = await Supplier.findByIdAndUpdate(
      id,
      {
        name,
        phone: String(body?.phone || "").trim(),
        address: String(body?.address || "").trim(),
      },
      { new: true }
    ).lean();
    if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ supplier });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
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
    const target = await Supplier.findById(id).lean();
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (target.name === UNKNOWN_SUPPLIER_NAME) {
      return NextResponse.json({ error: "Cannot delete the default supplier" }, { status: 400 });
    }
    const deleted = await Supplier.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
