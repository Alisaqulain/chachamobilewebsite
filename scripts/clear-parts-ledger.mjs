/**
 * Clear all supplier parts ledger data (purchases, returns, inventory stock groups).
 * Usage: npm run clear:parts-ledger
 * Optional dry run: npm run clear:parts-ledger -- --dry-run
 * Requires MONGODB_URI (loads .env.local like other scripts).
 */

import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const dotenvPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(dotenvPath)) {
  const content = fs.readFileSync(dotenvPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2].replace(/^["']|["']$/g, "");
      process.env[m[1]] = v;
    }
  }
}

const dryRun = process.argv.includes("--dry-run");

const root = path.resolve(import.meta.dirname, "..");
const mod = await import(pathToFileURL(path.join(root, "lib", "clearPartsSalesLedger.js")).href);
const { clearPartsSalesLedger } = mod;

if (!process.env.MONGODB_URI) {
  console.error("Set MONGODB_URI (e.g. in .env.local).");
  process.exit(1);
}

let result;
try {
  result = await clearPartsSalesLedger({ dryRun });
  console.log(JSON.stringify(result, null, 2));
  if (!dryRun) {
    console.log("Done. Suppliers and sales categories were not removed.");
  }
} finally {
  const mongoose = (await import("mongoose")).default;
  await mongoose.disconnect().catch(() => {});
}
