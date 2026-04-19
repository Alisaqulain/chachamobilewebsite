import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import SalesCategory from "@/models/SalesCategory";
import InventoryStockGroup from "@/models/InventoryStockGroup";
import PartsPurchase from "@/models/PartsPurchase";

export async function DELETE(request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const cat = await SalesCategory.findById(id).select("slug").lean();
    if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const inStock = await InventoryStockGroup.exists({ salesCategoryId: id });
    const inPurchases = await PartsPurchase.exists({ salesCategoryId: id });
    if (inStock || inPurchases) {
      return NextResponse.json(
        { error: "This sales category is used on stock or purchase lines. Reassign or remove those first." },
        { status: 400 }
      );
    }

    await SalesCategory.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
