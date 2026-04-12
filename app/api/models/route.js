import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PhoneModel from "@/models/PhoneModel";
import { getAdminFromCookies } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId")?.trim();
    const q = {};
    if (brandId && mongoose.Types.ObjectId.isValid(brandId)) {
      q.brandId = brandId;
    }
    const models = await PhoneModel.find(q).sort({ name: 1 }).populate("brandId", "name slug").lean();
    return NextResponse.json({
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
    return NextResponse.json({ error: "Failed to load models" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const name = String(body.name || "").trim();
    const brandId = String(body.brandId || "").trim();
    if (!name || !mongoose.Types.ObjectId.isValid(brandId)) {
      return NextResponse.json({ error: "Name and valid brandId are required" }, { status: 400 });
    }
    await connectDB();
    const doc = await PhoneModel.create({ name, brandId });
    const populated = await PhoneModel.findById(doc._id).populate("brandId", "name slug").lean();
    return NextResponse.json({
      model: {
        ...populated,
        _id: populated._id.toString(),
        brandId: populated.brandId
          ? {
              _id: populated.brandId._id.toString(),
              name: populated.brandId.name,
              slug: populated.brandId.slug,
            }
          : null,
      },
    });
  } catch (e) {
    if (e.code === 11000) {
      return NextResponse.json({ error: "Model already exists for this brand" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to create model" }, { status: 500 });
  }
}
