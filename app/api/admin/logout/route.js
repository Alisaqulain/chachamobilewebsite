import { NextResponse } from "next/server";
import { adminTokenCookieBaseOptions } from "@/lib/adminSessionCookie";

export async function POST(request) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_token", "", {
    ...adminTokenCookieBaseOptions(request),
    maxAge: 0,
  });
  return res;
}
