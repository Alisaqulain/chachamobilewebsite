import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import InventoryStockGroup from "@/models/InventoryStockGroup";
import PartsPurchase from "@/models/PartsPurchase";

function cleanDistinct(values) {
  const seen = new Set();
  const out = [];
  for (const raw of values || []) {
    const v = String(raw || "").trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const [branchesRaw, modelsRaw, qualitiesRaw, signaturesRaw] = await Promise.all([
      InventoryStockGroup.distinct("mobileName"),
      InventoryStockGroup.distinct("productName"),
      InventoryStockGroup.distinct("quality"),
      PartsPurchase.distinct("signatureName"),
    ]);

    const branches = cleanDistinct(branchesRaw).slice(0, 300);
    const models = cleanDistinct(modelsRaw).slice(0, 500);
    const qualities = cleanDistinct(qualitiesRaw).slice(0, 200);
    const signatures = cleanDistinct(signaturesRaw).slice(0, 500);

    return NextResponse.json({ branches, models, qualities, signatures });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load suggestions" }, { status: 500 });
  }
}

