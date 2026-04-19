import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import InventoryStockGroup from "@/models/InventoryStockGroup";
import PartsPurchase from "@/models/PartsPurchase";
import SalesCategory from "@/models/SalesCategory";
import { netStock } from "@/lib/partsInventory";

export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();

    const groups = await InventoryStockGroup.find()
      .sort({ mobileName: 1, productName: 1, quality: 1 })
      .lean();

    const lastDates =
      groups.length > 0
        ? await PartsPurchase.aggregate([
            {
              $match: {
                stockGroupId: { $in: groups.map((g) => g._id) },
              },
            },
            { $group: { _id: "$stockGroupId", lastAt: { $max: "$date" } } },
          ])
        : [];
    const lastMap = new Map(
      lastDates.map((x) => [String(x._id), x.lastAt ? new Date(x.lastAt).toISOString() : null])
    );

    const scIds = [...new Set(groups.map((g) => String(g.salesCategoryId)).filter(Boolean))];
    const cats =
      scIds.length > 0 ? await SalesCategory.find({ _id: { $in: scIds } }).select("name").lean() : [];
    const catMap = new Map(cats.map((c) => [String(c._id), c.name]));

    const items = groups.map((g) => ({
      stockGroupId: String(g._id),
      mobileName: g.mobileName,
      productName: g.productName,
      quality: g.quality,
      salesCategoryName: catMap.get(String(g.salesCategoryId)) || "—",
      totalStock: netStock(g),
      totalReturned: Number(g.returnedQty || 0),
      totalSold: Number(g.soldQty || 0),
      lastPurchaseDate: lastMap.get(String(g._id)) || null,
      canDelete: Number(g.soldQty || 0) === 0,
    }));

    return NextResponse.json({ items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
