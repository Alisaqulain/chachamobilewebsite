import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { signAdminToken } from "@/lib/jwt";

const DEFAULT_ADMIN_EMAIL = "yusuf@admin.com";
const DEFAULT_ADMIN_PASSWORD = "yusuf@110";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectDB();

    let admin = await Admin.findOne({ email: DEFAULT_ADMIN_EMAIL });
    if (!admin) {
      const hash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      try {
        admin = await Admin.create({ email: DEFAULT_ADMIN_EMAIL, password: hash });
      } catch (e) {
        if (e?.code === 11000) {
          admin = await Admin.findOne({ email: DEFAULT_ADMIN_EMAIL });
        } else {
          throw e;
        }
      }
    }

    const ok =
      email === DEFAULT_ADMIN_EMAIL && (await bcrypt.compare(password, admin.password));
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    let token;
    try {
      token = await signAdminToken({
        sub: admin._id.toString(),
        email: admin.email,
      });
    } catch (signErr) {
      const msg = signErr?.message || "";
      if (msg.includes("JWT_SECRET")) {
        return NextResponse.json(
          { error: "Server misconfigured: set JWT_SECRET (32+ characters) in the environment" },
          { status: 503 }
        );
      }
      throw signErr;
    }

    const res = NextResponse.json({ ok: true, email: admin.email });
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
