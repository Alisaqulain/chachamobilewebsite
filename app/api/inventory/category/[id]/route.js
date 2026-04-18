import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import InventoryStockGroup from "@/models/InventoryStockGroup";
import Category from "@/models/Category";
import PartsPurchase from "@/models/PartsPurchase";
import { netStock } from "@/lib/partsInventory";

function normKey(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function lineKey(mobileName, productName, quality) {
  return `${normKey(mobileName)}|${normKey(productName)}|${normKey(quality)}`;
}

export async function GET(request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    await connectDB();
    const cat = await Category.findById(id).lean();
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const groups = await InventoryStockGroup.find({ categoryId: id })
      .sort({ mobileName: 1, productName: 1, quality: 1 })
      .lean();

    const lastPurchase = await PartsPurchase.aggregate([
      { $match: { categoryId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: {
            mobileName: "$mobileName",
            productName: "$productName",
            quality: "$quality",
          },
          lastAt: { $max: "$date" },
        },
      },
    ]);
    const lastMap = new Map(
      lastPurchase.map((x) => [
        lineKey(x._id.mobileName, x._id.productName, x._id.quality),
        x.lastAt,
      ])
    );

    const items = groups.map((g) => ({
      stockGroupId: String(g._id),
      mobileName: g.mobileName,
      productName: g.productName,
      quality: g.quality,
      totalStock: netStock(g),
      totalReturned: Number(g.returnedQty || 0),
      totalPurchased: Number(g.purchasedQty || 0),
      totalSold: Number(g.soldQty || 0),
      lastPurchaseDate: lastMap.get(lineKey(g.mobileName, g.productName, g.quality)) || null,
    }));

    return NextResponse.json({
      category: { _id: String(cat._id), name: cat.name, slug: cat.slug },
      items,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
