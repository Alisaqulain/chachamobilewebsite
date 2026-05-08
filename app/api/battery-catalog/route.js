import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import BatteryCatalogItem from "@/models/BatteryCatalogItem";

function asText(v) {
  return String(v ?? "").trim();
}

function normalizeBatteryCode(raw) {
  const t = asText(raw).toUpperCase().replace(/\s+/g, " ").trim();
  if (!t) return "";
  // Normalize common battery-code formats that sometimes come with spaces instead of hyphens.
  // Examples: "BM 5M" -> "BM-5M", "BN 5P" -> "BN-5P"
  if (/^[A-Z]{1,4}\s+[A-Z0-9]{1,4}$/.test(t)) {
    return t.replace(/\s+/g, "-");
  }
  return t;
}

function parsePriceToken(raw) {
  const t = asText(raw);
  if (!t) return NaN;
  // "5-30" => 530, "4-75" => 475
  if (/^\d+\s*-\s*\d+$/.test(t)) {
    const [a, b] = t.split("-").map((x) => x.trim());
    const joined = `${a}${b.padStart(2, "0")}`;
    return Number(joined);
  }
  const n = Number(t.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

export async function GET(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const supplierKey = asText(searchParams.get("supplierKey")) || "genius";
    const brand = asText(searchParams.get("brand"));
    const q = asText(searchParams.get("q")).toLowerCase();
    const active = searchParams.get("active");

    await connectDB();
    const filter = { supplierKey };
    if (brand) filter.brand = brand;
    if (active === "1") filter.active = true;
    if (active === "0") filter.active = false;

    let rows = await BatteryCatalogItem.find(filter).sort({ brand: 1, phoneModel: 1, batteryCode: 1 }).lean();
    if (q) {
      rows = rows.filter((r) => {
        const hay = [r.brand, r.phoneModel, r.batteryCode].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }

    return NextResponse.json({
      items: rows.map((r) => ({
        _id: String(r._id),
        supplierKey: r.supplierKey,
        brand: r.brand,
        phoneModel: r.phoneModel,
        batteryCode: r.batteryCode,
        support: asText(r.support),
        listPrice: Number(r.listPrice || 0),
        active: Boolean(r.active),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load battery catalog" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const supplierKey = asText(body?.supplierKey) || "genius";
    const brand = asText(body?.brand);
    const phoneModel = asText(body?.phoneModel);
    const batteryCode = normalizeBatteryCode(body?.batteryCode);
    const support = asText(body?.support);
    const listPrice = parsePriceToken(body?.listPrice);
    const active = body?.active == null ? true : Boolean(body.active);

    if (!brand || !phoneModel || !batteryCode || !Number.isFinite(listPrice) || listPrice < 0) {
      return NextResponse.json(
        { error: "brand, phoneModel, batteryCode, and valid listPrice are required" },
        { status: 400 }
      );
    }

    await connectDB();

    let doc;
    let updated = false;
    try {
      doc = await BatteryCatalogItem.create({
        supplierKey,
        brand,
        phoneModel,
        batteryCode,
        support,
        listPrice,
        active,
      });
    } catch (e) {
      // Bulk import often re-sends existing rows; treat duplicates as "update in place"
      // so users can fix wrong prices by importing the correct list again.
      if (!/duplicate key/i.test(String(e?.message || ""))) throw e;
      updated = true;
      doc = await BatteryCatalogItem.findOneAndUpdate(
        { supplierKey, brand, phoneModel, batteryCode },
        { $set: { support, listPrice, active } },
        { new: true }
      );
      if (!doc) throw e;
    }

    return NextResponse.json({
      item: {
        _id: String(doc._id),
        supplierKey: doc.supplierKey,
        brand: doc.brand,
        phoneModel: doc.phoneModel,
        batteryCode: doc.batteryCode,
        support: asText(doc.support),
        listPrice: Number(doc.listPrice || 0),
        active: Boolean(doc.active),
      },
      updated,
    });
  } catch (e) {
    console.error(e);
    const msg = /duplicate key/i.test(String(e?.message || ""))
      ? "This battery item already exists"
      : "Failed to create battery item";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

