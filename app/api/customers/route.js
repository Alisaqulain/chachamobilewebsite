import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { getAdminFromCookies } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();
    const customers = await Customer.find().sort({ name: 1 }).lean();
    return NextResponse.json({
      customers: customers.map((c) => ({
        _id: String(c._id),
        name: c.name,
        phone: c.phone || "",
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load customers" }, { status: 500 });
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
    const customer = await Customer.create({
      name,
      phone: String(body?.phone || "").trim(),
    });
    return NextResponse.json({
      customer: {
        _id: String(customer._id),
        name: customer.name,
        phone: customer.phone || "",
      },
    });
  } catch (e) {
    console.error(e);
    const msg = /duplicate key/i.test(String(e?.message || "")) ? "Customer already exists" : "Failed to create customer";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
