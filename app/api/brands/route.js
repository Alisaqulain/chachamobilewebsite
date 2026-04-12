import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Brand from "@/models/Brand";
import { getAdminFromCookies } from "@/lib/auth";
import { slugify } from "@/utils/slugify";

function escapeRx(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isDuplicateKeyError(e) {
  return e?.code === 11000 || e?.code === 11001 || e?.cause?.code === 11000;
}

export async function GET() {
  try {
    await connectDB();
    const brands = await Brand.find().sort({ name: 1 }).lean();
    return NextResponse.json({
      brands: brands.map((b) => ({ ...b, _id: b._id.toString() })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load brands" }, { status: 500 });
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
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    await connectDB();
    const slug = body.slug ? slugify(String(body.slug)) : slugify(name);
    if (!slug) {
      return NextResponse.json(
        { error: "Name must contain letters or numbers so a URL slug can be generated" },
        { status: 400 }
      );
    }

    const bySlug = await Brand.findOne({ slug }).lean();
    if (bySlug) {
      return NextResponse.json(
        {
          error: `Slug "${slug}" is already used by "${bySlug.name}". "apple" and "Apple" share the same slug — edit or remove the existing brand, or pick a distinct name.`,
        },
        { status: 409 }
      );
    }

    const nameTaken = await Brand.findOne({
      name: new RegExp(`^${escapeRx(name)}$`, "i"),
    }).lean();
    if (nameTaken) {
      return NextResponse.json(
        { error: `Brand "${nameTaken.name}" already exists (names are case-insensitive for duplicates).` },
        { status: 409 }
      );
    }

    const brand = await Brand.create({ name, slug });
    return NextResponse.json({
      brand: { ...brand.toObject(), _id: brand._id.toString() },
    });
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      return NextResponse.json(
        { error: "A brand with this name or slug already exists." },
        { status: 409 }
      );
    }
    if (e?.name === "ValidationError") {
      const msg = Object.values(e.errors || {})
        .map((x) => x.message)
        .join(" ");
      return NextResponse.json({ error: msg || "Validation failed" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to create brand" }, { status: 500 });
  }
}
