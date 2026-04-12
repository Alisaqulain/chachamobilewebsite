import { cookies } from "next/headers";
import { verifyAdminToken } from "./jwt";

export async function getAdminFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  try {
    const decoded = await verifyAdminToken(token);
    return { id: decoded.sub, email: decoded.email };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const admin = await getAdminFromCookies();
  if (!admin) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return admin;
}
