import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import InventoryStockGroup from "@/models/InventoryStockGroup";
import PartsPurchase from "@/models/PartsPurchase";
import SalesCategory from "@/models/SalesCategory";
import { netStock } from "@/lib/partsInventory";

function tokens(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const salesCategoryId = searchParams.get("salesCategoryId")?.trim();
    const quality = searchParams.get("quality")?.trim();

    await connectDB();
    /** Only ledger lines that appear on at least one supplier purchase (hides orphan / demo groups). */
    const purchasedGroupIds = (await PartsPurchase.distinct("stockGroupId")).filter(Boolean);
    if (purchasedGroupIds.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const filter = { _id: { $in: purchasedGroupIds } };
    if (salesCategoryId) filter.salesCategoryId = salesCategoryId;
    if (quality) {
      filter.quality = new RegExp(escapeRegex(quality), "i");
    }

    const rows = await InventoryStockGroup.find(filter).sort({ mobileName: 1, productName: 1 }).lean();
    const cats = await SalesCategory.find().select("name").lean();
    const catMap = new Map(cats.map((c) => [String(c._id), c.name]));

    const toks = tokens(q);

    const rowMatchesTokens = (g) => {
      const hay = [
        g.mobileName,
        g.productName,
        g.quality,
        catMap.get(String(g.salesCategoryId)) || "",
      ]
        .join(" ")
        .toLowerCase()
        .replace(/\s+/g, " ");
      if (toks.length === 0) return true;
      return toks.every((t) => hay.includes(t));
    };

    // Only rows that match the query (no "same folder" expansion — avoids listing every model under a folder).
    const matched = rows.filter(rowMatchesTokens);

    const groupIds = matched.map((g) => g._id);
    const lastDates =
      groupIds.length > 0
        ? await PartsPurchase.aggregate([
            { $match: { stockGroupId: { $in: groupIds } } },
            { $group: { _id: "$stockGroupId", lastPurchaseDate: { $max: "$date" } } },
          ])
        : [];
    const lastPurchaseByGroup = new Map(
      lastDates.map((x) => [String(x._id), x.lastPurchaseDate ? new Date(x.lastPurchaseDate).toISOString() : null])
    );

    const grouped = new Map();
    for (const g of matched) {
      const label = [g.mobileName, g.productName].filter(Boolean).join(" — ") || g.productName;
      if (!grouped.has(label)) grouped.set(label, []);
      const fromAgg = lastPurchaseByGroup.get(String(g._id));
      const fromGroup = g.lastPurchaseAt ? new Date(g.lastPurchaseAt).toISOString() : null;
      const lastPurchaseDate = fromAgg || fromGroup;
      grouped.get(label).push({
        quality: g.quality,
        netStock: netStock(g),
        salesCategoryName: catMap.get(String(g.salesCategoryId)) || "",
        salesCategoryId: String(g.salesCategoryId),
        stockGroupId: String(g._id),
        folderName: g.mobileName,
        lastPurchaseDate,
      });
    }

    return NextResponse.json({
      results: [...grouped.entries()].map(([label, qualities]) => ({
        label,
        qualities,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
