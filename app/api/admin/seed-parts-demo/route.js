import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import { seedPartsDashboardDemo } from "@/lib/seedPartsDashboardDemo";

/**
 * POST — load dummy parts purchases + shop sales for dashboard charts (testing).
 * Set ALLOW_PARTS_DEMO_SEED=true in .env.local to enable.
 */
export async function POST() {
  try {
    if (process.env.ALLOW_PARTS_DEMO_SEED !== "true") {
      return NextResponse.json(
        {
          error: "Disabled. Set ALLOW_PARTS_DEMO_SEED=true in .env.local, restart the server, then try again.",
        },
        { status: 403 }
      );
    }
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const out = await seedPartsDashboardDemo();
    return NextResponse.json(out);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
