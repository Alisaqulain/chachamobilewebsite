import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import { deleteInventoryStockGroupById } from "@/lib/deleteInventoryStockGroup";

export async function DELETE(request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const result = await deleteInventoryStockGroupById(id);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    const msg = e?.message || "Failed";
    const status = msg.includes("not found") ? 404 : msg.includes("sold") || msg.includes("Invalid") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
