import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { getAdminFromCookies } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const [productCount, categoryCount, recentRaw] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Product.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("categoryId", "name slug")
        .lean(),
    ]);

    const recentProducts = recentRaw.map((p) => ({
      ...p,
      _id: p._id.toString(),
      categoryId: p.categoryId
        ? {
            _id: p.categoryId._id.toString(),
            name: p.categoryId.name,
            slug: p.categoryId.slug,
          }
        : null,
    }));

    return NextResponse.json({ productCount, categoryCount, recentProducts });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
