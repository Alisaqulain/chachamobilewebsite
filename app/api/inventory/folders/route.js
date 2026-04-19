import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import InventoryStockGroup from "@/models/InventoryStockGroup";

export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const groups = await InventoryStockGroup.find().select("mobileName").lean();
    const counts = new Map();
    for (const g of groups) {
      const name = String(g.mobileName || "").trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    const folders = [...counts.entries()]
      .map(([name, lineCount]) => ({ name, lineCount }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    return NextResponse.json({ folders });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
