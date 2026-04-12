import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Brand from "@/models/Brand";
import PhoneModel from "@/models/PhoneModel";
import { getAdminFromCookies } from "@/lib/auth";
import { serializeProduct } from "@/lib/productSerialize";
import { migrateProductRefsOnce } from "@/lib/migrateProductRefs";
import mongoose from "mongoose";

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request) {
  try {
    await connectDB();
    await migrateProductRefsOnce();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category")?.trim();
    const brandId = searchParams.get("brandId")?.trim();
    const modelId = searchParams.get("modelId")?.trim();
    const brandName = searchParams.get("brand")?.trim();
    const modelName = searchParams.get("model")?.trim();
    const quality = searchParams.get("quality")?.trim();
    const featured = searchParams.get("featured");

    const filter = {};

    if (featured === "true") {
      filter.featured = true;
    }

    if (quality) {
      filter.quality = quality;
    }

    if (modelId && mongoose.Types.ObjectId.isValid(modelId)) {
      filter.modelId = modelId;
    } else if (modelName) {
      const mq = { name: new RegExp(`^${escapeRegex(modelName)}$`, "i") };
      if (brandId && mongoose.Types.ObjectId.isValid(brandId)) {
        mq.brandId = brandId;
      } else if (brandName) {
        const bdoc = await Brand.findOne({
          name: new RegExp(`^${escapeRegex(brandName)}$`, "i"),
        }).lean();
        if (bdoc) mq.brandId = bdoc._id;
      }
      const pm = await PhoneModel.findOne(mq).lean();
      if (pm) filter.modelId = pm._id;
      else filter.model = new RegExp(`^${escapeRegex(modelName)}$`, "i");
    }

    if (!filter.modelId) {
      if (brandId && mongoose.Types.ObjectId.isValid(brandId)) {
        filter.brandId = brandId;
      } else if (brandName) {
        const b = await Brand.findOne({ name: new RegExp(`^${escapeRegex(brandName)}$`, "i") }).lean();
        if (b) filter.brandId = b._id;
        else filter.brand = new RegExp(`^${escapeRegex(brandName)}$`, "i");
      }
    } else if (brandId && mongoose.Types.ObjectId.isValid(brandId)) {
      filter.brandId = brandId;
    }

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.categoryId = category;
      } else {
        const cat = await Category.findOne({ slug: category.toLowerCase() });
        if (!cat) {
          return NextResponse.json({ products: [] });
        }
        filter.categoryId = cat._id;
      }
    }

    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: rx }, { model: rx }, { brand: rx }];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .populate("categoryId", "name slug")
      .populate("brandId", "name slug")
      .populate("modelId", "name slug brandId")
      .lean();

    const serialized = products.map((p) => serializeProduct(p));

    return NextResponse.json({ products: serialized });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    if (!name || !categoryId || !brandId || !modelId || price == null || !quality) {
      return NextResponse.json(
        { error: "Missing required fields (name, categoryId, brandId, modelId, price, quality)" },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(brandId) ||
      !mongoose.Types.ObjectId.isValid(modelId) ||
      !mongoose.Types.ObjectId.isValid(categoryId)
    ) {
      return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
    }

    await connectDB();
    const [b, m] = await Promise.all([Brand.findById(brandId).lean(), PhoneModel.findById(modelId).lean()]);
    if (!b || !m) {
      return NextResponse.json({ error: "Brand or model not found" }, { status: 400 });
    }
    if (String(m.brandId) !== String(b._id)) {
      return NextResponse.json({ error: "Model does not belong to selected brand" }, { status: 400 });
    }

    const product = await Product.create({
      name: String(name).trim(),
      categoryId,
      brandId,
      modelId,
      brand: b.name,
      model: m.name,
      price: Number(price),
      quality,
      description: description != null ? String(description) : "",
      images: Array.isArray(images) ? images.filter(Boolean) : [],
      featured: Boolean(featured),
    });

    const populated = await Product.findById(product._id)
      .populate("categoryId", "name slug")
      .populate("brandId", "name slug")
      .populate("modelId", "name slug brandId")
      .lean();

    return NextResponse.json({
      product: serializeProduct(populated),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
