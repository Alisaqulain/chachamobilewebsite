import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import SalesCategory from "@/models/SalesCategory";
import { ensureSalesLedgerFolderId } from "@/lib/salesCategoryHelpers";
import { slugify } from "@/utils/slugify";

/** Parts / sales-system ledger categories only (separate from website Category). */
export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    await ensureSalesLedgerFolderId();
    const rows = await SalesCategory.find().sort({ name: 1 }).lean();
    return NextResponse.json({
      categories: rows.map((c) => ({
        ...c,
        _id: c._id.toString(),
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load sales categories" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const name = String(body?.name || "").trim();
    let slug = body?.slug != null ? String(body.slug).trim().toLowerCase() : "";
    const image = body?.image != null ? String(body.image).trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!slug) slug = slugify(name);
    else slug = slugify(slug);

    await connectDB();
    const doc = await SalesCategory.create({ name, slug, image });
    return NextResponse.json({
      category: {
        ...doc.toObject(),
        _id: doc._id.toString(),
      },
    });
  } catch (e) {
    if (e?.code === 11000) {
      return NextResponse.json({ error: "A sales category with this slug already exists" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to create" }, { status: 500 });
  }
}
