import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecretKey } from "@/lib/jwt";

function needsJwt(request) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  if (request.method === "OPTIONS") {
    return false;
  }

  if (pathname.startsWith("/admin")) {
    if (
      pathname === "/admin" ||
      pathname === "/admin/login" ||
      pathname.startsWith("/admin/website") ||
      pathname.startsWith("/admin/sell")
    ) {
      return false;
    }
    return true;
  }

  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/login") {
    return true;
  }

  if (pathname === "/api/upload" && method === "POST") {
    return true;
  }

  if (pathname === "/api/products" && method === "POST") {
    return true;
  }

  if (pathname.startsWith("/api/products/") && (method === "PUT" || method === "DELETE")) {
    return true;
  }

  if (pathname === "/api/categories" && method === "POST") {
    return true;
  }

  if (pathname.startsWith("/api/categories/") && (method === "PUT" || method === "DELETE")) {
    return true;
  }

  if (
    (pathname.startsWith("/api/brands") || pathname.startsWith("/api/models")) &&
    method !== "GET"
  ) {
    return true;
  }

  return false;
}

function deny(request) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export async function middleware(request) {
  if (!needsJwt(request)) {
    return NextResponse.next();
  }

  const secret = getJwtSecretKey();
  if (!secret) {
    const body = {
      error: "Server misconfigured: set a strong JWT_SECRET (32+ characters) in the environment",
    };
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(body, { status: 503 });
    }
    return new NextResponse(body.error, { status: 503 });
  }

  const token = request.cookies.get("admin_token")?.value;
  if (!token) {
    return deny(request);
  }

  try {
    await jwtVerify(token, secret);
  } catch {
    return deny(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/upload",
    "/api/products",
    "/api/products/:path*",
    "/api/categories",
    "/api/categories/:path*",
    "/api/brands",
    "/api/brands/:path*",
    "/api/models",
    "/api/models/:path*",
  ],
};
