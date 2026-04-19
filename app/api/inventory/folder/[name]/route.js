import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import InventoryStockGroup from "@/models/InventoryStockGroup";
import SalesCategory from "@/models/SalesCategory";
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
    const params = await context.params;
    const raw = params?.name != null ? String(params.name) : "";
    const folderName = decodeURIComponent(raw).trim();
    if (!folderName) {
      return NextResponse.json({ error: "Folder name required" }, { status: 400 });
    }
    await connectDB();
    const esc = folderName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(`^${esc}$`, "i");

    const groups = await InventoryStockGroup.find({ mobileName: rx })
      .sort({ productName: 1, quality: 1 })
      .lean();

    const scIds = [...new Set(groups.map((g) => String(g.salesCategoryId)).filter(Boolean))];
    const cats =
      scIds.length > 0
        ? await SalesCategory.find({ _id: { $in: scIds } }).select("name slug").lean()
        : [];
    const cat = cats[0] || { _id: "", name: "Folder", slug: "folder" };

    const lastPurchase = await PartsPurchase.aggregate([
      { $match: { mobileName: rx } },
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
      canDelete: Number(g.soldQty || 0) === 0,
    }));

    return NextResponse.json({
      folder: { name: groups[0]?.mobileName || folderName },
      salesCategory: { _id: String(cat._id || ""), name: cat.name, slug: cat.slug || "" },
      items,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
