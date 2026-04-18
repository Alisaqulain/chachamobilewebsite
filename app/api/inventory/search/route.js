import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import InventoryStockGroup from "@/models/InventoryStockGroup";
import Category from "@/models/Category";
import { netStock } from "@/lib/partsInventory";

function tokens(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export async function GET(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const categoryId = searchParams.get("categoryId")?.trim();
    const quality = searchParams.get("quality")?.trim();

    await connectDB();
    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    if (quality) filter.quality = quality;

    const rows = await InventoryStockGroup.find(filter).sort({ mobileName: 1, productName: 1 }).lean();
    const cats = await Category.find().select("name").lean();
    const catMap = new Map(cats.map((c) => [String(c._id), c.name]));

    const toks = tokens(q);
    const matched = rows.filter((g) => {
      const hay = [
        g.mobileName,
        g.productName,
        g.quality,
        catMap.get(String(g.categoryId)) || "",
      ]
        .join(" ")
        .toLowerCase()
        .replace(/\s+/g, " ");
      if (toks.length === 0) return true;
      return toks.every((t) => hay.includes(t));
    });

    const grouped = new Map();
    for (const g of matched) {
      const label = [g.mobileName, g.productName].filter(Boolean).join(" — ") || g.productName;
      if (!grouped.has(label)) grouped.set(label, []);
      grouped.get(label).push({
        quality: g.quality,
        netStock: netStock(g),
        categoryName: catMap.get(String(g.categoryId)) || "",
        categoryId: String(g.categoryId),
        stockGroupId: String(g._id),
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
