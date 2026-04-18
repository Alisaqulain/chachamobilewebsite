import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ProductQuality from "@/models/ProductQuality";
import { getAdminFromCookies } from "@/lib/auth";
import { slugify } from "@/utils/slugify";
import { ensureDefaultProductQualities } from "@/lib/productQualityHelpers";

export async function GET() {
  try {
    await connectDB();
    await ensureDefaultProductQualities();
    const rows = await ProductQuality.find().sort({ sortOrder: 1, name: 1 }).lean();
    return NextResponse.json({
      qualities: rows.map((q) => ({
        _id: String(q._id),
        name: q.name,
        slug: q.slug,
        sortOrder: Number(q.sortOrder ?? 0),
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load qualities" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const name = String(body?.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const sortOrder = Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0;
    const slug = slugify(name);
    await connectDB();
    await ensureDefaultProductQualities();
    const existing = await ProductQuality.findOne({
      $or: [{ slug }, { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }],
    }).lean();
    if (existing) {
      return NextResponse.json({ error: "A quality with this name already exists" }, { status: 409 });
    }
    const doc = await ProductQuality.create({ name, slug, sortOrder });
    return NextResponse.json({
      quality: {
        _id: String(doc._id),
        name: doc.name,
        slug: doc.slug,
        sortOrder: doc.sortOrder,
      },
    });
  } catch (e) {
    if (e.code === 11000) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to create quality" }, { status: 500 });
  }
}
