import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Brand from "@/models/Brand";
import PhoneModel from "@/models/PhoneModel";
import { getAdminFromCookies } from "@/lib/auth";
import { serializeProduct } from "@/lib/productSerialize";
import { migrateProductRefsOnce } from "@/lib/migrateProductRefs";
import mongoose from "mongoose";

export async function GET(request, context) {
  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    await migrateProductRefsOnce();
    const product = await Product.findById(id)
      .populate("categoryId", "name slug")
      .populate("brandId", "name slug")
      .populate("modelId", "name slug brandId")
      .lean();
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ product: serializeProduct(product) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
}

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
    const {
      name,
      categoryId,
      brandId,
      modelId,
      price,
      quality,
      description,
      images,
      featured,
    } = body;

    await connectDB();
    const update = {};
    if (name != null) update.name = String(name).trim();
    if (categoryId != null) update.categoryId = categoryId;
    if (price != null) update.price = Number(price);
    if (quality != null) update.quality = quality;
    if (description != null) update.description = String(description);
    if (images != null) update.images = Array.isArray(images) ? images.filter(Boolean) : [];
    if (featured != null) update.featured = Boolean(featured);

    if (brandId != null || modelId != null) {
      const nextBrandId = brandId != null ? String(brandId) : undefined;
      const nextModelId = modelId != null ? String(modelId) : undefined;
      if (nextBrandId && !mongoose.Types.ObjectId.isValid(nextBrandId)) {
        return NextResponse.json({ error: "Invalid brandId" }, { status: 400 });
      }
      if (nextModelId && !mongoose.Types.ObjectId.isValid(nextModelId)) {
        return NextResponse.json({ error: "Invalid modelId" }, { status: 400 });
      }
      if (nextBrandId) update.brandId = nextBrandId;
      if (nextModelId) update.modelId = nextModelId;

      const bid = nextBrandId || (await Product.findById(id).select("brandId").lean())?.brandId;
      const mid = nextModelId || (await Product.findById(id).select("modelId").lean())?.modelId;
      if (bid && mid) {
        const [b, m] = await Promise.all([Brand.findById(bid).lean(), PhoneModel.findById(mid).lean()]);
        if (!b || !m) {
          return NextResponse.json({ error: "Brand or model not found" }, { status: 400 });
        }
        if (String(m.brandId) !== String(b._id)) {
          return NextResponse.json({ error: "Model does not belong to selected brand" }, { status: 400 });
        }
        update.brand = b.name;
        update.model = m.name;
      }
    }

    const product = await Product.findByIdAndUpdate(id, update, { new: true })
      .populate("categoryId", "name slug")
      .populate("brandId", "name slug")
      .populate("modelId", "name slug brandId")
      .lean();

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ product: serializeProduct(product) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
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
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
