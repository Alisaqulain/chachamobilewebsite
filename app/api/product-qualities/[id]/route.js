import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import ProductQuality from "@/models/ProductQuality";
import Product from "@/models/Product";
import { getAdminFromCookies } from "@/lib/auth";
import { slugify } from "@/utils/slugify";

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function PUT(request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await request.json();
    await connectDB();
    const doc = await ProductQuality.findById(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const oldName = doc.name;
    if (body.name != null) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      if (name !== oldName) {
        const clash = await ProductQuality.findOne({
          _id: { $ne: doc._id },
          $or: [{ slug: slugify(name) }, { name: new RegExp(`^${escapeRegex(name)}$`, "i") }],
        }).lean();
        if (clash) {
          return NextResponse.json({ error: "Another quality already uses this name" }, { status: 409 });
        }
        await Product.updateMany({ quality: oldName }, { $set: { quality: name } });
        doc.name = name;
        doc.slug = slugify(name);
      }
    }
    if (body.sortOrder != null && Number.isFinite(Number(body.sortOrder))) {
      doc.sortOrder = Number(body.sortOrder);
    }
    await doc.save();
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
      return NextResponse.json({ error: "Slug conflict" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const doc = await ProductQuality.findById(id).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const inUse = await Product.countDocuments({ quality: doc.name });
    if (inUse > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${inUse} product(s) use quality "${doc.name}"` },
        { status: 409 }
      );
    }
    await ProductQuality.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
