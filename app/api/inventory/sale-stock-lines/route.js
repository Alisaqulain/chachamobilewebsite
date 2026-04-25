import { NextResponse } from "next/server";
import mongoose from "mongoose";
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
    .split(/[\s,]+/)
    .filter(Boolean);
}

/**
 * Lines that have purchase-backed stock and net qty &gt; 0 — for sales entry picker.
 * Query: salesCategoryId (optional), branch (substring on folder/mobileName), q (substring tokens), signature (substring on signature names only).
 */
export async function GET(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const salesCategoryId = searchParams.get("salesCategoryId")?.trim();
    const branch = searchParams.get("branch")?.trim() || "";
    const q = searchParams.get("q")?.trim() || "";
    const signature = searchParams.get("signature")?.trim() || "";

    await connectDB();
    const purchasedIds = (await PartsPurchase.distinct("stockGroupId")).filter(Boolean);
    if (!purchasedIds.length) {
      return NextResponse.json({ lines: [] });
    }

    const filter = { _id: { $in: purchasedIds } };
    if (salesCategoryId && mongoose.Types.ObjectId.isValid(salesCategoryId)) {
      filter.salesCategoryId = salesCategoryId;
    }

    const groups = await InventoryStockGroup.find(filter).sort({ mobileName: 1, productName: 1 }).lean();
    const cats = await SalesCategory.find().select("name").lean();
    const catMap = new Map(cats.map((c) => [String(c._id), c.name]));

    const groupIds = groups.map((g) => g._id);
    const sigAgg =
      groupIds.length > 0
        ? await PartsPurchase.aggregate([
            { $match: { stockGroupId: { $in: groupIds } } },
            { $group: { _id: "$stockGroupId", sigs: { $addToSet: "$signatureName" } } },
          ])
        : [];
    const sigMap = new Map(
      sigAgg.map((x) => [
        String(x._id),
        (x.sigs || [])
          .filter((s) => String(s || "").trim())
          .map((s) => String(s).trim())
          .join(" "),
      ])
    );

    const branchLower = branch.toLowerCase();
    const qToks = tokens(q);
    const signatureLower = signature.toLowerCase();

    const lines = [];
    for (const g of groups) {
      const n = netStock(g);
      if (n <= 0) continue;
      if (branchLower && !String(g.mobileName || "").toLowerCase().includes(branchLower)) continue;

      const hay = [
        g.mobileName,
        g.productName,
        g.quality,
        catMap.get(String(g.salesCategoryId)) || "",
        sigMap.get(String(g._id)) || "",
      ]
        .join(" ")
        .toLowerCase()
        .replace(/[,\-_/]+/g, " ")
        .replace(/\s+/g, " ");
      const sigHay = String(sigMap.get(String(g._id)) || "").toLowerCase();

      if (qToks.length && !qToks.every((t) => hay.includes(t))) continue;
      if (signatureLower && !sigHay.includes(signatureLower)) continue;

      lines.push({
        stockGroupId: String(g._id),
        branch: g.mobileName,
        model: g.productName,
        quality: g.quality,
        salesCategoryId: String(g.salesCategoryId),
        salesCategoryName: catMap.get(String(g.salesCategoryId)) || "",
        netStock: n,
        label: `${g.mobileName} — ${g.productName} · ${g.quality} · ${n} pcs`,
      });
    }

    return NextResponse.json({ lines });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
