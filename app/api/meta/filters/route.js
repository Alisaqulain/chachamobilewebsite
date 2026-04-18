import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import Brand from "@/models/Brand";
import PhoneModel from "@/models/PhoneModel";
import ProductQuality from "@/models/ProductQuality";
import { ensureDefaultProductQualities } from "@/lib/productQualityHelpers";

export async function GET() {
  try {
    await connectDB();
    await ensureDefaultProductQualities();
    const [categories, brands, models, qualities] = await Promise.all([
      Category.find().sort({ name: 1 }).lean(),
      Brand.find().sort({ name: 1 }).lean(),
      PhoneModel.find().sort({ name: 1 }).populate("brandId", "name slug").lean(),
      ProductQuality.find().sort({ sortOrder: 1, name: 1 }).lean(),
    ]);

    return NextResponse.json({
      categories: categories.map((c) => ({ ...c, _id: c._id.toString() })),
      brands: brands.map((b) => ({ ...b, _id: b._id.toString() })),
      qualities: qualities.map((q) => ({
        _id: q._id.toString(),
        name: q.name,
        slug: q.slug,
        sortOrder: Number(q.sortOrder ?? 0),
      })),
      models: models.map((m) => ({
        ...m,
        _id: m._id.toString(),
        brandId: m.brandId
          ? typeof m.brandId === "object"
            ? { _id: m.brandId._id.toString(), name: m.brandId.name, slug: m.brandId.slug }
            : String(m.brandId)
          : null,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
