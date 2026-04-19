import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import { clearPartsSalesLedger } from "@/lib/clearPartsSalesLedger";

/**
 * POST — destructive: clears all parts purchases, returns, inventory stock groups, and related movements.
 * Requires ALLOW_CLEAR_PARTS_LEDGER=true in environment.
 */
export async function POST(request) {
  try {
    if (process.env.ALLOW_CLEAR_PARTS_LEDGER !== "true") {
      return NextResponse.json(
        { error: "Disabled. Set ALLOW_CLEAR_PARTS_LEDGER=true in .env.local to enable." },
        { status: 403 }
      );
    }
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    let dryRun = false;
    try {
      const body = await request.json();
      if (body?.dryRun === true) dryRun = true;
    } catch {
      /* no body */
    }
    const result = await clearPartsSalesLedger({ dryRun });
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
