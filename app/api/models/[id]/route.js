import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PhoneModel from "@/models/PhoneModel";
import Product from "@/models/Product";
import { getAdminFromCookies } from "@/lib/auth";
import mongoose from "mongoose";

export async function PUT(request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await request.json();
    const name = body.name != null ? String(body.name).trim() : undefined;
    const brandId = body.brandId != null ? String(body.brandId).trim() : undefined;

    await connectDB();
    const update = {};
    if (name !== undefined) update.name = name;
    if (brandId && mongoose.Types.ObjectId.isValid(brandId)) update.brandId = brandId;

    const doc = await PhoneModel.findByIdAndUpdate(id, update, { new: true })
      .populate("brandId", "name slug")
      .lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      model: {
        ...doc,
        _id: doc._id.toString(),
        brandId: doc.brandId
          ? {
              _id: doc.brandId._id.toString(),
              name: doc.brandId.name,
              slug: doc.brandId.slug,
            }
          : null,
      },
    });
  } catch (e) {
    if (e.code === 11000) {
      return NextResponse.json({ error: "Model name conflict for this brand" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to update model" }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const inUse = await Product.exists({ modelId: id });
    if (inUse) {
      return NextResponse.json({ error: "Cannot delete model that has products" }, { status: 409 });
    }
    const deleted = await PhoneModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete model" }, { status: 500 });
  }
}
