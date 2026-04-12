import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
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
    let slug = body.slug;
    if (slug != null) slug = slugify(String(slug));
    const image = body.image != null ? String(body.image).trim() : undefined;

    await connectDB();
    const update = {};
    if (name !== undefined) update.name = name;
    if (slug !== undefined && slug) update.slug = slug;
    if (image !== undefined) update.image = image;

    const category = await Category.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!category) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      category: { ...category, _id: category._id.toString() },
    });
  } catch (e) {
    if (e.code === 11000) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
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
    const inUse = await Product.exists({ categoryId: id });
    if (inUse) {
      return NextResponse.json(
        { error: "Cannot delete category that has products" },
        { status: 409 }
      );
    }

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
