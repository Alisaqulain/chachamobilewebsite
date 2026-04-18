import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import PartsPurchaseReturn from "@/models/PartsPurchaseReturn";
import PartsPurchase from "@/models/PartsPurchase";
import { applyPartsReturnDelete } from "@/lib/partsInventory";

export async function DELETE(request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const ret = await PartsPurchaseReturn.findById(id).lean();
    if (!ret) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const purchase = await PartsPurchase.findById(ret.partsPurchaseId).lean();
    if (!purchase) return NextResponse.json({ error: "Purchase missing" }, { status: 400 });
    await applyPartsReturnDelete(ret, purchase);
    await PartsPurchaseReturn.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
