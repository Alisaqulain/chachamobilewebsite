import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Supplier from "@/models/Supplier";
import { getAdminFromCookies } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();
    const suppliers = await Supplier.find().sort({ name: 1 }).lean();
    return NextResponse.json({
      suppliers: suppliers.map((s) => ({
        _id: String(s._id),
        name: s.name,
        phone: s.phone || "",
        address: s.address || "",
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load suppliers" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const name = String(body?.name || "").trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    await connectDB();
    const supplier = await Supplier.create({
      name,
      phone: String(body?.phone || "").trim(),
      address: String(body?.address || "").trim(),
    });
    return NextResponse.json({
      supplier: {
        _id: String(supplier._id),
        name: supplier.name,
        phone: supplier.phone || "",
        address: supplier.address || "",
      },
    });
  } catch (e) {
    console.error(e);
    const msg = /duplicate key/i.test(String(e?.message || "")) ? "Supplier already exists" : "Failed to create supplier";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
