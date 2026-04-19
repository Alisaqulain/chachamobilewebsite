import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { getAdminFromCookies } from "@/lib/auth";
import { slugify } from "@/utils/slugify";
import { filterCategoriesForPublicShop } from "@/lib/shopCategoryPublic";

/** Website / shop catalogue defaults only (not parts ledger — see SalesCategory + /api/sales-categories). */
const DEFAULT_SALES_CATEGORIES = [
  "Battery",
  "Folder",
  "OC Class",
  "Back Panel",
  "Body",
  "Spare Parts",
  "Frame",
];

async function ensureDefaultSalesCategories() {
  const existing = await Category.find({}, { name: 1 }).lean();
  const existingNames = new Set(existing.map((c) => String(c.name || "").trim().toLowerCase()));

  const missing = DEFAULT_SALES_CATEGORIES.filter(
    (name) => !existingNames.has(name.trim().toLowerCase())
  );

  if (missing.length === 0) return;

  const ops = missing.map((name) => ({
    updateOne: {
      filter: { slug: slugify(name) },
      update: { $setOnInsert: { name, slug: slugify(name), image: "" } },
      upsert: true,
    },
  }));

  await Category.bulkWrite(ops, { ordered: false });
}

export async function GET(request) {
  try {
    await connectDB();
    await ensureDefaultSalesCategories();
    const { searchParams } = new URL(request.url);
    const withCounts = searchParams.get("withCounts") === "1";
    const scopeAdmin = searchParams.get("scope") === "admin";
    const admin = await getAdminFromCookies();
    const listAllShopCategories = scopeAdmin && admin;

    let categories = await Category.find().sort({ name: 1 }).lean();

    if (!listAllShopCategories) {
      categories = filterCategoriesForPublicShop(categories);
    }

    if (withCounts) {
      const agg = await Product.aggregate([
        { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      ]);
      const map = new Map(agg.map((a) => [String(a._id), a.count]));
      categories = categories.map((c) => ({
        ...c,
        productCount: map.get(String(c._id)) || 0,
      }));
    }

    return NextResponse.json({
      categories: categories.map((c) => ({
        ...c,
        _id: c._id.toString(),
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
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
    let slug = body.slug ? String(body.slug).trim().toLowerCase() : "";
    const image = body.image != null ? String(body.image).trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!slug) slug = slugify(name);
    else slug = slugify(slug);

    await connectDB();
    const category = await Category.create({ name, slug, image });
    return NextResponse.json({
      category: {
        ...category.toObject(),
        _id: category._id.toString(),
      },
    });
  } catch (e) {
    if (e.code === 11000) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
