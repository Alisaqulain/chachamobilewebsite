import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { signAdminToken } from "@/lib/jwt";
import { adminTokenCookieBaseOptions } from "@/lib/adminSessionCookie";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await connectDB();

    const admin = await Admin.findOne({ email }).lean();
    if (!admin) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, String(admin.password || ""));
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signAdminToken({ sub: admin._id.toString(), email: admin.email });

    const res = NextResponse.json({ ok: true, admin: { email: admin.email } });
    res.cookies.set("admin_token", token, {
      ...adminTokenCookieBaseOptions(request),
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
