import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Brand from "@/models/Brand";
import PhoneModel from "@/models/PhoneModel";
import Product from "@/models/Product";
import { getAdminFromCookies } from "@/lib/auth";
import { slugify } from "@/utils/slugify";
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
    let slug = body.slug != null ? slugify(String(body.slug)) : undefined;

    await connectDB();
    const update = {};
    if (name !== undefined) update.name = name;
    if (slug !== undefined && slug) update.slug = slug;

    const brand = await Brand.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!brand) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ brand: { ...brand, _id: brand._id.toString() } });
  } catch (e) {
    if (e.code === 11000) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to update brand" }, { status: 500 });
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
    const hasModels = await PhoneModel.exists({ brandId: id });
    if (hasModels) {
      return NextResponse.json(
        { error: "Delete models under this brand first" },
        { status: 409 }
      );
    }
    const hasProducts = await Product.exists({ brandId: id });
    if (hasProducts) {
      return NextResponse.json({ error: "Cannot delete brand that has products" }, { status: 409 });
    }
    const deleted = await Brand.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 });
  }
}
